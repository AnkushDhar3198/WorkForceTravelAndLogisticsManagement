package com.cbg.travel.service;

import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SmsService {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Dispatches real SMS OTP via Twilio, Fast2SMS, Generic Webhook, or TextBelt.
     */
    public boolean sendSms(String toPhone, String messageText) {
        // 1. Check Twilio REST API
        String accountSid = System.getenv("TWILIO_ACCOUNT_SID");
        String authToken = System.getenv("TWILIO_AUTH_TOKEN");
        String fromPhone = System.getenv("TWILIO_PHONE_NUMBER");

        if (accountSid != null && !accountSid.trim().isEmpty() &&
            authToken != null && !authToken.trim().isEmpty() &&
            fromPhone != null && !fromPhone.trim().isEmpty()) {
            boolean twilioOk = sendTwilioSms(accountSid.trim(), authToken.trim(), fromPhone.trim(), toPhone, messageText);
            if (twilioOk) return true;
        }

        // 2. Check Fast2SMS API (Indian SMS Gateway)
        String fast2smsKey = System.getenv("FAST2SMS_API_KEY");
        if (fast2smsKey != null && !fast2smsKey.trim().isEmpty()) {
            boolean fast2smsOk = sendFast2Sms(fast2smsKey.trim(), toPhone, messageText);
            if (fast2smsOk) return true;
        }

        // 3. Check Generic HTTP Webhook SMS Gateway
        String smsGatewayUrl = System.getenv("SMS_GATEWAY_URL");
        if (smsGatewayUrl != null && !smsGatewayUrl.trim().isEmpty()) {
            boolean genericOk = sendGenericHttpSms(smsGatewayUrl.trim(), toPhone, messageText);
            if (genericOk) return true;
        }

        // 4. Zero-Config Public SMS Gateway Fallback (TextBelt)
        return sendTextBeltSms(toPhone, messageText);
    }

    private boolean sendTwilioSms(String accountSid, String authToken, String fromPhone, String toPhone, String messageText) {
        try {
            String cleanTo = toPhone.trim().replaceAll("[^+\\d]", "");
            if (!cleanTo.startsWith("+")) cleanTo = "+" + cleanTo;

            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            Map<String, String> formData = new HashMap<>();
            formData.put("To", cleanTo);
            formData.put("From", fromPhone.trim());
            formData.put("Body", messageText);

            String formUrlEncoded = formData.entrySet().stream()
                    .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining("&"));

            String authHeader = "Basic " + Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formUrlEncoded))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 Twilio SMS Dispatch Result (" + response.statusCode() + "): " + response.body());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception e) {
            System.err.println("Twilio SMS Exception: " + e.getMessage());
            return false;
        }
    }

    private boolean sendFast2Sms(String apiKey, String toPhone, String messageText) {
        try {
            String cleanTo = toPhone.replaceAll("\\D", "");
            if (cleanTo.length() > 10) cleanTo = cleanTo.substring(cleanTo.length() - 10);

            // Extract 6-digit OTP code from messageText
            String otpCode = "123984";
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\b\\d{6}\\b").matcher(messageText);
            if (matcher.find()) {
                otpCode = matcher.group();
            }

            String cleanKey = apiKey.trim();
            System.out.println("📲 [Fast2SMS Dispatching] OTP (" + otpCode + ") to +91-" + cleanTo);

            // Attempt 1: Fast2SMS Quick Route (route=q) GET Request
            String simpleMsg = "CBG Enterprise Security OTP code: " + otpCode;
            String qUrl = "https://www.fast2sms.com/dev/bulkV2?authorization=" + URLEncoder.encode(cleanKey, StandardCharsets.UTF_8) +
                    "&route=q&message=" + URLEncoder.encode(simpleMsg, StandardCharsets.UTF_8) +
                    "&language=english&flash=0&numbers=" + cleanTo;

            HttpRequest qReq = HttpRequest.newBuilder()
                    .uri(URI.create(qUrl))
                    .header("authorization", cleanKey)
                    .GET()
                    .build();

            HttpResponse<String> qRes = httpClient.send(qReq, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 [Fast2SMS route=q GET] Status: " + qRes.statusCode() + " | Body: " + qRes.body());

            if (qRes.statusCode() == 200 && qRes.body().contains("\"return\":true")) {
                return true;
            }

            // Attempt 2: Fast2SMS High-Priority OTP Route (route=otp) GET Request
            String otpUrl = "https://www.fast2sms.com/dev/bulkV2?authorization=" + URLEncoder.encode(cleanKey, StandardCharsets.UTF_8) +
                    "&route=otp&variables_values=" + otpCode + "&flash=0&numbers=" + cleanTo;

            HttpRequest otpReq = HttpRequest.newBuilder()
                    .uri(URI.create(otpUrl))
                    .header("authorization", cleanKey)
                    .GET()
                    .build();

            HttpResponse<String> otpRes = httpClient.send(otpReq, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 [Fast2SMS route=otp GET] Status: " + otpRes.statusCode() + " | Body: " + otpRes.body());

            if (otpRes.statusCode() == 200 && otpRes.body().contains("\"return\":true")) {
                return true;
            }

            // Attempt 3: Fast2SMS POST JSON Payload
            String postJson = String.format("{\"route\":\"q\",\"message\":\"%s\",\"language\":\"english\",\"flash\":0,\"numbers\":\"%s\"}",
                    simpleMsg, cleanTo);
            HttpRequest postReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.fast2sms.com/dev/bulkV2"))
                    .header("authorization", cleanKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(postJson))
                    .build();

            HttpResponse<String> postRes = httpClient.send(postReq, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 [Fast2SMS POST JSON] Status: " + postRes.statusCode() + " | Body: " + postRes.body());

            return postRes.statusCode() == 200 && postRes.body().contains("\"return\":true");
        } catch (Exception e) {
            System.err.println("Fast2SMS Exception: " + e.getMessage());
            return false;
        }
    }

    private boolean sendGenericHttpSms(String gatewayUrl, String toPhone, String messageText) {
        try {
            String fullUrl = gatewayUrl.replace("{phone}", URLEncoder.encode(toPhone, StandardCharsets.UTF_8))
                                       .replace("{message}", URLEncoder.encode(messageText, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(fullUrl)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            System.err.println("Generic SMS Webhook Exception: " + e.getMessage());
            return false;
        }
    }

    private boolean sendTextBeltSms(String toPhone, String messageText) {
        try {
            String cleanTo = toPhone.trim().replaceAll("[^+\\d]", "");
            if (!cleanTo.startsWith("+")) cleanTo = "+" + cleanTo;

            Map<String, String> formData = new HashMap<>();
            formData.put("phone", cleanTo);
            formData.put("message", messageText);
            formData.put("key", "textbelt");

            String formUrlEncoded = formData.entrySet().stream()
                    .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining("&"));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://textbelt.com/text"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formUrlEncoded))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("TextBelt SMS Dispatch Result (" + response.statusCode() + "): " + response.body());
            return response.statusCode() == 200 && response.body().contains("\"success\":true");
        } catch (Exception e) {
            System.err.println("TextBelt SMS Exception: " + e.getMessage());
            return false;
        }
    }
}
