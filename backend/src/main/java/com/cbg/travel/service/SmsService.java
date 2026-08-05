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
     * Dispatches real SMS OTP via Twilio, Fast2SMS, or Generic SMS Gateway API.
     */
    public boolean sendSms(String toPhone, String messageText) {
        // 1. Check Twilio REST API
        String accountSid = System.getenv("TWILIO_ACCOUNT_SID");
        String authToken = System.getenv("TWILIO_AUTH_TOKEN");
        String fromPhone = System.getenv("TWILIO_PHONE_NUMBER");

        if (accountSid != null && !accountSid.isEmpty() &&
            authToken != null && !authToken.isEmpty() &&
            fromPhone != null && !fromPhone.isEmpty()) {
            return sendTwilioSms(accountSid, authToken, fromPhone, toPhone, messageText);
        }

        // 2. Check Fast2SMS API (Popular free/low-cost SMS Gateway)
        String fast2smsKey = System.getenv("FAST2SMS_API_KEY");
        if (fast2smsKey != null && !fast2smsKey.isEmpty()) {
            return sendFast2Sms(fast2smsKey, toPhone, messageText);
        }

        // 3. Check Generic HTTP Webhook SMS Gateway
        String smsGatewayUrl = System.getenv("SMS_GATEWAY_URL");
        if (smsGatewayUrl != null && !smsGatewayUrl.isEmpty()) {
            return sendGenericHttpSms(smsGatewayUrl, toPhone, messageText);
        }

        // 4. Zero-Config Public SMS Gateway Fallback (TextBelt Free Gateway)
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

            System.out.println("📲 Dispatching Fast2SMS Cellular OTP (" + otpCode + ") to: +91 " + cleanTo);

            // Strategy 1: Fast2SMS High-Priority OTP Route (route=otp)
            String otpUrl = "https://www.fast2sms.com/dev/bulkV2?authorization=" + apiKey.trim() +
                    "&route=otp&variables_values=" + otpCode + "&flash=0&numbers=" + cleanTo;

            HttpRequest otpRequest = HttpRequest.newBuilder().uri(URI.create(otpUrl)).GET().build();
            HttpResponse<String> otpResponse = httpClient.send(otpRequest, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 Fast2SMS OTP Route Response (" + otpResponse.statusCode() + "): " + otpResponse.body());

            if (otpResponse.statusCode() == 200 && otpResponse.body().contains("\"return\":true")) {
                return true;
            }

            // Strategy 2: Fast2SMS Quick Text Route (route=q)
            String qUrl = "https://www.fast2sms.com/dev/bulkV2?authorization=" + apiKey.trim() +
                    "&route=q&message=" + URLEncoder.encode(messageText, StandardCharsets.UTF_8) +
                    "&language=english&flash=0&numbers=" + cleanTo;

            HttpRequest qRequest = HttpRequest.newBuilder().uri(URI.create(qUrl)).GET().build();
            HttpResponse<String> qResponse = httpClient.send(qRequest, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 Fast2SMS Quick Route Response (" + qResponse.statusCode() + "): " + qResponse.body());

            return qResponse.statusCode() == 200 && qResponse.body().contains("\"return\":true");
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
