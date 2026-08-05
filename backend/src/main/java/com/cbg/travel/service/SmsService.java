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
     * Dispatches real SMS OTP via Twilio REST API if credentials are provided in Environment.
     */
    public boolean sendSms(String toPhone, String messageText) {
        String accountSid = System.getenv("TWILIO_ACCOUNT_SID");
        String authToken = System.getenv("TWILIO_AUTH_TOKEN");
        String fromPhone = System.getenv("TWILIO_PHONE_NUMBER");

        if (accountSid == null || accountSid.isEmpty() ||
            authToken == null || authToken.isEmpty() ||
            fromPhone == null || fromPhone.isEmpty()) {
            System.out.println("📲 [SMS GATEWAY DISPATCH SIMULATED] To: " + toPhone + " | Message: " + messageText);
            System.out.println("ℹ️ To send real SMS messages to physical mobile phones, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER env vars.");
            return false;
        }

        try {
            String cleanTo = toPhone.trim().replaceAll("[^+\\d]", "");
            if (!cleanTo.startsWith("+")) {
                cleanTo = "+" + cleanTo;
            }

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

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("✅ [REAL CELLULAR SMS DISPATCH SUCCESS] Sent to " + cleanTo + " via Twilio! Status: " + response.statusCode());
                return true;
            } else {
                System.err.println("❌ [SMS DISPATCH ERROR] Twilio returned status " + response.statusCode() + ": " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("❌ [SMS GATEWAY EXCEPTION] Failed to dispatch SMS to " + toPhone + ": " + e.getMessage());
            return false;
        }
    }
}
