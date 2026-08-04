package com.cbg.travel.controller;

import com.cbg.travel.entity.TravelRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TravelApiController {

    private final List<TravelRequest> travelRequests = Collections.synchronizedList(new ArrayList<>());
    private final List<Map<String, Object>> vendors = new ArrayList<>();
    private final List<Map<String, Object>> logisticsAssets = new ArrayList<>();
    private final List<Map<String, Object>> disruptions = new ArrayList<>();
    private final List<Map<String, Object>> riskLocations = new ArrayList<>();
    private final List<Map<String, Object>> expenseClaims = new ArrayList<>();

    public TravelApiController() {
        // Initialize mock enterprise seed data for instant testing
        TravelRequest req1 = new TravelRequest(101L, "Sarah Jenkins", "Senior AI Engineer", "Tokyo, Japan", "JP", LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 22), "Keynote Demo at APAC Developer Conference & Prototype Sync", 3450.0, "Economy Premium", 280.0, "APPROVED", null, 94, LocalDate.of(2026, 8, 1));
        TravelRequest req2 = new TravelRequest(102L, "Marcus Vance", "Global Supply Chain Lead", "Frankfurt, Germany", "DE", LocalDate.of(2026, 8, 18), LocalDate.of(2026, 8, 25), "Logistics Facility Audit & Keynote Vendor Summit", 5200.0, "Business", 420.0, "POLICY_VIOLATION", "Hotel daily rate ($420) exceeds policy cap ($350); Business Class flight requires VP sign-off", 82, LocalDate.of(2026, 8, 3));
        TravelRequest req3 = new TravelRequest(103L, "Elena Rostova", "Enterprise Security Director", "London, United Kingdom", "GB", LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 14), "Cybersecurity Executive Briefing & Data Sovereign Audit", 2890.0, "Economy Premium", 310.0, "APPROVED", null, 98, LocalDate.of(2026, 7, 28));

        travelRequests.add(req1);
        travelRequests.add(req2);
        travelRequests.add(req3);

        // Story 4: Preferred Vendors
        vendors.add(Map.of("id", 1, "name", "Japan Airlines (JAL)", "category", "FLIGHT", "corporateRate", 1250, "standardRate", 1800, "discountPercentage", 30, "rating", 4.9, "badges", List.of("Preferred Corporate Rate", "Carbon Neutral")));
        vendors.add(Map.of("id", 2, "name", "Lufthansa Group", "category", "FLIGHT", "corporateRate", 1400, "standardRate", 1950, "discountPercentage", 28, "rating", 4.8, "badges", List.of("Flex Rebooking", "Priority Lounge")));
        vendors.add(Map.of("id", 3, "name", "Park Hyatt Tokyo", "category", "HOTEL", "corporateRate", 280, "standardRate", 450, "discountPercentage", 37, "rating", 4.9, "badges", List.of("Includes Breakfast", "Late Checkout")));
        vendors.add(Map.of("id", 4, "name", "Grand Hyatt Berlin", "category", "HOTEL", "corporateRate", 320, "standardRate", 480, "discountPercentage", 33, "rating", 4.7, "badges", List.of("Corporate Partner", "Executive Club")));
        vendors.add(Map.of("id", 5, "name", "Sixt Executive Chauffeur", "category", "GROUND_TRANSPORT", "corporateRate", 110, "standardRate", 160, "discountPercentage", 31, "rating", 4.9, "badges", List.of("EV Fleet", "Instant Dispatch")));

        // Story 5: Logistics Asset Tracking & Sync
        logisticsAssets.add(Map.of("id", 1, "assetName", "Apple Vision Pro Gen-2 Prototype #08", "serialNumber", "AVP-2026-X99", "destinationVenue", "Tokyo Midtown Hall", "syncedEmployee", "Sarah Jenkins", "targetDeliveryDate", "2026-08-14", "trackingCode", "LOG-JP-884920", "status", "IN_TRANSIT"));
        logisticsAssets.add(Map.of("id", 2, "assetName", "Secure Edge AI Server Hardware Rack", "serialNumber", "SRV-884-ENC", "destinationVenue", "Frankfurt Hub Center", "syncedEmployee", "Marcus Vance", "targetDeliveryDate", "2026-08-17", "trackingCode", "LOG-DE-993214", "status", "CUSTOMS_CLEARANCE"));

        // Story 6: Real-time Disruption Notifications
        disruptions.add(Map.of("id", 1, "title", "Flight JL006 Delayed (45m)", "message", "JAL Flight JL006 to Tokyo Haneda delayed due to weather. Connecting shuttle updated.", "severity", "MEDIUM", "timestamp", "10 mins ago", "category", "FLIGHT"));
        disruptions.add(Map.of("id", 2, "title", "Asset Delivered to Venue", "message", "Prototype #08 delivered and signed by Tokyo Midtown Logistics Desk.", "severity", "INFO", "timestamp", "1 hour ago", "category", "LOGISTICS"));
        disruptions.add(Map.of("id", 3, "title", "Geopolitical Risk Alert: Frankfurt", "message", "Transit strike scheduled in Frankfurt on Aug 19. Alternative chauffeur booked.", "severity", "HIGH", "timestamp", "3 hours ago", "category", "RISK"));

        // Story 7: Duty of Care Risk Locations
        riskLocations.add(Map.of("id", 1, "employeeName", "Sarah Jenkins", "city", "Tokyo", "country", "Japan", "lat", 35.6762, "lng", 139.6503, "threatLevel", "LOW", "status", "SAFE"));
        riskLocations.add(Map.of("id", 2, "employeeName", "Marcus Vance", "city", "Frankfurt", "country", "Germany", "lat", 50.1109, "lng", 8.6821, "threatLevel", "MODERATE", "status", "ALERT"));
        riskLocations.add(Map.of("id", 3, "employeeName", "Alex Rivera", "city", "Miami", "country", "United States", "lat", 25.7617, "lng", -80.1918, "threatLevel", "HIGH", "status", "ASSISTANCE_REQUESTED"));

        // Story 8 & 9: OCR Expense Claims & Audits
        expenseClaims.add(Map.of("id", 1, "employeeName", "Sarah Jenkins", "vendorName", "Tokyo Metro Express", "category", "Ground Transport", "date", "2026-08-02", "amount", 48.50, "taxAmount", 4.85, "ocrConfidence", 98.4, "auditStatus", "APPROVED_PAYOUT", "matchedItineraryId", 101));
        expenseClaims.add(Map.of("id", 2, "employeeName", "Marcus Vance", "vendorName", "Lufthansa Executive Dining", "category", "Meals & Entertaining", "date", "2026-08-03", "amount", 185.00, "taxAmount", 24.13, "ocrConfidence", 95.2, "auditStatus", "PENDING_AUDIT", "matchedItineraryId", 102));
    }

    // Story 1 & 2: Pre-Trip Request Creation & Automated Policy Engine
    @GetMapping("/travel-requests")
    public List<TravelRequest> getTravelRequests() {
        return travelRequests;
    }

    @PostMapping("/travel-requests")
    public ResponseEntity<TravelRequest> createTravelRequest(@RequestBody TravelRequest request) {
        // Run Automated Policy Engine validation rules
        List<String> violations = new ArrayList<>();
        if (request.getHotelDailyRate() != null && request.getHotelDailyRate() > 350.0) {
            violations.add("Hotel daily rate ($" + request.getHotelDailyRate() + ") exceeds regional policy cap ($350)");
        }
        if ("Business".equalsIgnoreCase(request.getFlightClass()) || "First".equalsIgnoreCase(request.getFlightClass())) {
            violations.add(request.getFlightClass() + " flight class requires Vice-President Exception Approval");
        }

        request.setId((long) (Math.random() * 900 + 200));
        request.setCreatedAt(LocalDate.now());
        request.setRoiScore((int) (Math.random() * 20 + 80));

        if (!violations.isEmpty()) {
            request.setStatus("POLICY_VIOLATION");
            request.setPolicyViolations(String.join("; ", violations));
        } else {
            request.setStatus("PENDING_APPROVAL");
        }

        travelRequests.add(0, request);
        return ResponseEntity.ok(request);
    }

    // Story 3: Managerial Approval Workflow
    @PutMapping("/travel-requests/{id}/status")
    public ResponseEntity<TravelRequest> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        for (TravelRequest req : travelRequests) {
            if (req.getId().equals(id)) {
                req.setStatus(newStatus);
                return ResponseEntity.ok(req);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // Story 4: Preferred Vendor Selection
    @GetMapping("/vendors")
    public List<Map<String, Object>> getVendors() {
        return vendors;
    }

    // Story 5: Asset Shipment & Synchronization
    @GetMapping("/logistics/assets")
    public List<Map<String, Object>> getLogisticsAssets() {
        return logisticsAssets;
    }

    // Story 6: Real-Time Disruption Notifications
    @GetMapping("/notifications/disruptions")
    public List<Map<String, Object>> getDisruptions() {
        return disruptions;
    }

    // Story 7: Duty of Care & Traveler Risk Monitoring
    @GetMapping("/risk/travelers")
    public List<Map<String, Object>> getRiskLocations() {
        return riskLocations;
    }

    @PostMapping("/risk/sos")
    public ResponseEntity<Map<String, Object>> triggerSosBroadcast(@RequestBody Map<String, String> payload) {
        String employeeName = payload.getOrDefault("employeeName", "Employee");
        Map<String, Object> sosResponse = Map.of(
            "status", "EMERGENCY_DISPATCHED",
            "message", "Emergency assistance team and local embassy dispatched for " + employeeName,
            "dispatchTime", new Date().toString()
        );
        return ResponseEntity.ok(sosResponse);
    }

    // Story 8: Expense Reporting via OCR
    @PostMapping("/expenses/ocr")
    public ResponseEntity<Map<String, Object>> processExpenseOcr(@RequestBody Map<String, Object> payload) {
        Map<String, Object> claim = new HashMap<>();
        claim.put("id", (int) (Math.random() * 800 + 300));
        claim.put("employeeName", "Sarah Jenkins");
        claim.put("vendorName", "Apple Store Midtown Tokyo");
        claim.put("category", "Event Hardware & Prototype Supplies");
        claim.put("date", LocalDate.now().toString());
        claim.put("amount", 429.00);
        claim.put("taxAmount", 42.90);
        claim.put("ocrConfidence", 99.4);
        claim.put("auditStatus", "PENDING_AUDIT");
        claim.put("matchedItineraryId", 101);

        expenseClaims.add(0, claim);
        return ResponseEntity.ok(claim);
    }

    // Story 9: Expense Auditing & Reimbursement
    @GetMapping("/expenses")
    public List<Map<String, Object>> getExpenseClaims() {
        return expenseClaims;
    }

    @PostMapping("/expenses/{id}/reimburse")
    public ResponseEntity<Map<String, Object>> reimburseExpense(@PathVariable int id) {
        for (Map<String, Object> claim : expenseClaims) {
            if (Objects.equals(claim.get("id"), id)) {
                claim.put("auditStatus", "APPROVED_PAYOUT");
                return ResponseEntity.ok(claim);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // Story 10: Analytics & ROI Reporting
    @GetMapping("/analytics/roi")
    public Map<String, Object> getAnalytics() {
        return Map.of(
            "totalSpend", 148500,
            "policyComplianceRate", 94.2,
            "activeTripsCount", 18,
            "savingsFromCorporateRates", 42300,
            "spendByDepartment", List.of(
                Map.of("department", "Engineering & Product", "spend", 62000),
                Map.of("department", "Global Supply Chain", "spend", 38000),
                Map.of("department", "Enterprise Sales", "spend", 31000),
                Map.of("department", "Executive & Legal", "spend", 17500)
            ),
            "policyViolationBreakdown", List.of(
                Map.of("reason", "Hotel Rate Above Cap", "count", 12),
                Map.of("reason", "Unapproved Cabin Class", "count", 5),
                Map.of("reason", "Late Booking (<7 Days)", "count", 8),
                Map.of("reason", "Non-Preferred Vendor", "count", 3)
            )
        );
    }
}
