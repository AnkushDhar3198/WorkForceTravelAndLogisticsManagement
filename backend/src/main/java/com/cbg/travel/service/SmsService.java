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

        System.out.println("📲 [SMS GATEWAY LOG] Dispatched 6-digit SMS OTP to " + toPhone);
        System.out.println("ℹ️ Add TWILIO_ACCOUNT_SID, FAST2SMS_API_KEY, or SMS_GATEWAY_URL to Render Env for direct cellular SMS delivery.");
        return false;
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

            String url = "https://www.fast2sms.com/dev/bulkV2?authorization=" + apiKey +
                    "&route=q&message=" + URLEncoder.encode(messageText, StandardCharsets.UTF_8) +
                    "&language=english&flash=0&numbers=" + cleanTo;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("authorization", apiKey)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
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
}
