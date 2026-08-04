package com.cbg.travel.config;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepo;
    private final PolicyRuleRepository policyRuleRepo;
    private final VendorRepository vendorRepo;
    private final TravelRequestRepository travelRequestRepo;
    private final ShipmentRepository shipmentRepo;
    private final NotificationRepository notificationRepo;
    private final TravelerLocationRepository travelerLocationRepo;
    private final ExpenseClaimRepository expenseClaimRepo;

    public DataSeeder(EmployeeRepository employeeRepo, PolicyRuleRepository policyRuleRepo,
                      VendorRepository vendorRepo, TravelRequestRepository travelRequestRepo,
                      ShipmentRepository shipmentRepo, NotificationRepository notificationRepo,
                      TravelerLocationRepository travelerLocationRepo, ExpenseClaimRepository expenseClaimRepo) {
        this.employeeRepo = employeeRepo;
        this.policyRuleRepo = policyRuleRepo;
        this.vendorRepo = vendorRepo;
        this.travelRequestRepo = travelRequestRepo;
        this.shipmentRepo = shipmentRepo;
        this.notificationRepo = notificationRepo;
        this.travelerLocationRepo = travelerLocationRepo;
        this.expenseClaimRepo = expenseClaimRepo;
    }

    @Override
    public void run(String... args) {
        if (employeeRepo.count() > 0) return; // Already seeded

        // --- EMPLOYEES ---
        Employee manager = new Employee();
        manager.setEmployeeCode("MGR-001");
        manager.setFirstName("David");
        manager.setLastName("Chen");
        manager.setEmail("david.chen@company.com");
        manager.setPhone("+1-415-555-0101");
        manager.setRole(UserRole.MANAGER);
        manager.setDepartment("Engineering");
        manager.setDesignation("VP Engineering");
        manager.setNationality("US");
        manager = employeeRepo.save(manager);

        Employee emp1 = new Employee();
        emp1.setEmployeeCode("EMP-101");
        emp1.setFirstName("Sarah");
        emp1.setLastName("Jenkins");
        emp1.setEmail("sarah.jenkins@company.com");
        emp1.setPhone("+1-415-555-0201");
        emp1.setRole(UserRole.EMPLOYEE);
        emp1.setDepartment("Engineering");
        emp1.setDesignation("Senior Software Engineer");
        emp1.setNationality("US");
        emp1.setPassportNumber("US9384756");
        emp1.setPassportExpiry(LocalDate.of(2029, 6, 15));
        emp1.setManagerId(manager.getId());
        emp1.setEmergencyContactName("John Jenkins");
        emp1.setEmergencyContactPhone("+1-415-555-0301");
        emp1 = employeeRepo.save(emp1);

        Employee emp2 = new Employee();
        emp2.setEmployeeCode("EMP-102");
        emp2.setFirstName("Marcus");
        emp2.setLastName("Vance");
        emp2.setEmail("marcus.vance@company.com");
        emp2.setPhone("+1-212-555-0102");
        emp2.setRole(UserRole.EMPLOYEE);
        emp2.setDepartment("Supply Chain");
        emp2.setDesignation("Global Logistics Lead");
        emp2.setNationality("US");
        emp2.setPassportNumber("US2847561");
        emp2.setPassportExpiry(LocalDate.of(2028, 11, 22));
        emp2.setManagerId(manager.getId());
        emp2 = employeeRepo.save(emp2);

        Employee emp3 = new Employee();
        emp3.setEmployeeCode("EMP-103");
        emp3.setFirstName("Elena");
        emp3.setLastName("Rostova");
        emp3.setEmail("elena.rostova@company.com");
        emp3.setPhone("+44-20-5555-0103");
        emp3.setRole(UserRole.RISK_OFFICER);
        emp3.setDepartment("Security");
        emp3.setDesignation("Enterprise Security Director");
        emp3.setNationality("GB");
        emp3.setManagerId(manager.getId());
        emp3 = employeeRepo.save(emp3);

        Employee finAdmin = new Employee();
        finAdmin.setEmployeeCode("FIN-001");
        finAdmin.setFirstName("Lisa");
        finAdmin.setLastName("Park");
        finAdmin.setEmail("lisa.park@company.com");
        finAdmin.setPhone("+1-415-555-0401");
        finAdmin.setRole(UserRole.FINANCE_ADMIN);
        finAdmin.setDepartment("Finance");
        finAdmin.setDesignation("Finance Director");
        finAdmin.setNationality("US");
        finAdmin = employeeRepo.save(finAdmin);

        Employee logistics = new Employee();
        logistics.setEmployeeCode("LOG-001");
        logistics.setFirstName("Raj");
        logistics.setLastName("Patel");
        logistics.setEmail("raj.patel@company.com");
        logistics.setPhone("+91-98765-43210");
        logistics.setRole(UserRole.LOGISTICS_COORDINATOR);
        logistics.setDepartment("Operations");
        logistics.setDesignation("Logistics Coordinator");
        logistics.setNationality("IN");
        logistics = employeeRepo.save(logistics);

        // --- POLICY RULES ---
        PolicyRule hotelCap = new PolicyRule();
        hotelCap.setRuleName("Regional Hotel Daily Cap");
        hotelCap.setRuleType("HOTEL_CAP");
        hotelCap.setThresholdValue(350.0);
        hotelCap.setComparisonOperator("GT");
        hotelCap.setSeverityLevel("WARNING");
        hotelCap.setViolationMessage("Hotel daily rate ($%.0f) exceeds regional policy cap ($%.0f/night)");
        policyRuleRepo.save(hotelCap);

        PolicyRule flightClass = new PolicyRule();
        flightClass.setRuleName("Restricted Flight Class");
        flightClass.setRuleType("FLIGHT_CLASS");
        flightClass.setAllowedValues("BUSINESS,FIRST");
        flightClass.setComparisonOperator("NOT_IN");
        flightClass.setSeverityLevel("REQUIRES_APPROVAL");
        flightClass.setViolationMessage("Business/First class cabin requires VP-level exception approval");
        policyRuleRepo.save(flightClass);

        PolicyRule advanceBooking = new PolicyRule();
        advanceBooking.setRuleName("Minimum Advance Booking");
        advanceBooking.setRuleType("ADVANCE_BOOKING");
        advanceBooking.setThresholdValue(7.0);
        advanceBooking.setComparisonOperator("LT");
        advanceBooking.setSeverityLevel("WARNING");
        advanceBooking.setViolationMessage("Trip booked with only %d days advance notice (minimum 7 days required)");
        policyRuleRepo.save(advanceBooking);

        PolicyRule budgetCap = new PolicyRule();
        budgetCap.setRuleName("Single Trip Budget Cap");
        budgetCap.setRuleType("BUDGET_CAP");
        budgetCap.setThresholdValue(10000.0);
        budgetCap.setComparisonOperator("GT");
        budgetCap.setSeverityLevel("BLOCK");
        budgetCap.setViolationMessage("Trip budget ($%.0f) exceeds maximum single-trip threshold ($%.0f)");
        policyRuleRepo.save(budgetCap);

        // --- VENDORS ---
        Vendor v1 = new Vendor(); v1.setName("Japan Airlines (JAL)"); v1.setCategory("FLIGHT"); v1.setCorporateRate(1250.0); v1.setStandardRate(1800.0); v1.setRating(4.9); v1.setBadges("Preferred Partner,Carbon Neutral"); v1.setRegion("APAC"); vendorRepo.save(v1);
        Vendor v2 = new Vendor(); v2.setName("Lufthansa Group"); v2.setCategory("FLIGHT"); v2.setCorporateRate(1400.0); v2.setStandardRate(1950.0); v2.setRating(4.8); v2.setBadges("Flex Rebooking,Priority Lounge"); v2.setRegion("EMEA"); vendorRepo.save(v2);
        Vendor v3 = new Vendor(); v3.setName("Delta Airlines"); v3.setCategory("FLIGHT"); v3.setCorporateRate(980.0); v3.setStandardRate(1450.0); v3.setRating(4.6); v3.setBadges("SkyMiles Partnership,Wi-Fi Included"); v3.setRegion("AMERICAS"); vendorRepo.save(v3);
        Vendor v4 = new Vendor(); v4.setName("Park Hyatt"); v4.setCategory("HOTEL"); v4.setCorporateRate(280.0); v4.setStandardRate(450.0); v4.setRating(4.9); v4.setBadges("Includes Breakfast,Late Checkout"); v4.setRegion("GLOBAL"); vendorRepo.save(v4);
        Vendor v5 = new Vendor(); v5.setName("Marriott International"); v5.setCategory("HOTEL"); v5.setCorporateRate(220.0); v5.setStandardRate(380.0); v5.setRating(4.7); v5.setBadges("Corporate Partner,Executive Club"); v5.setRegion("GLOBAL"); vendorRepo.save(v5);
        Vendor v6 = new Vendor(); v6.setName("Sixt Executive"); v6.setCategory("GROUND_TRANSPORT"); v6.setCorporateRate(110.0); v6.setStandardRate(160.0); v6.setRating(4.8); v6.setBadges("EV Fleet,Instant Dispatch"); v6.setRegion("EMEA"); vendorRepo.save(v6);

        // --- TRAVEL REQUESTS ---
        TravelRequest tr1 = new TravelRequest();
        tr1.setEmployee(emp1);
        tr1.setDestination("Tokyo, Japan");
        tr1.setCountryCode("JP");
        tr1.setStartDate(LocalDate.of(2026, 8, 15));
        tr1.setEndDate(LocalDate.of(2026, 8, 22));
        tr1.setPurpose("Keynote presentation at APAC Developer Conference and prototype sync with Tokyo engineering team");
        tr1.setEstimatedBudget(3450.0);
        tr1.setFlightClass("PREMIUM_ECONOMY");
        tr1.setHotelDailyRate(280.0);
        tr1.setMealAllowance(75.0);
        tr1.setGroundTransportBudget(200.0);
        tr1.setStatus(TravelRequestStatus.APPROVED);
        tr1.setPolicyComplianceScore(100);
        tr1.setRoiScore(94);
        tr1.setApprovedBy(manager);
        tr1.setApprovedAt(LocalDateTime.now().minusDays(5));
        travelRequestRepo.save(tr1);

        TravelRequest tr2 = new TravelRequest();
        tr2.setEmployee(emp2);
        tr2.setDestination("Frankfurt, Germany");
        tr2.setCountryCode("DE");
        tr2.setStartDate(LocalDate.of(2026, 8, 18));
        tr2.setEndDate(LocalDate.of(2026, 8, 25));
        tr2.setPurpose("Logistics Facility Audit and Vendor Summit with EMEA supply chain partners");
        tr2.setEstimatedBudget(5200.0);
        tr2.setFlightClass("BUSINESS");
        tr2.setHotelDailyRate(420.0);
        tr2.setMealAllowance(100.0);
        tr2.setGroundTransportBudget(350.0);
        tr2.setStatus(TravelRequestStatus.POLICY_VIOLATION);
        tr2.setPolicyViolations("Hotel daily rate ($420) exceeds regional policy cap ($350/night); Business/First class cabin requires VP-level exception approval");
        tr2.setPolicyComplianceScore(50);
        tr2.setRoiScore(82);
        travelRequestRepo.save(tr2);

        TravelRequest tr3 = new TravelRequest();
        tr3.setEmployee(emp3);
        tr3.setDestination("London, United Kingdom");
        tr3.setCountryCode("GB");
        tr3.setStartDate(LocalDate.of(2026, 8, 10));
        tr3.setEndDate(LocalDate.of(2026, 8, 14));
        tr3.setPurpose("Cybersecurity executive briefing and data sovereignty compliance audit");
        tr3.setEstimatedBudget(2890.0);
        tr3.setFlightClass("PREMIUM_ECONOMY");
        tr3.setHotelDailyRate(310.0);
        tr3.setMealAllowance(65.0);
        tr3.setGroundTransportBudget(180.0);
        tr3.setStatus(TravelRequestStatus.APPROVED);
        tr3.setPolicyComplianceScore(100);
        tr3.setRoiScore(98);
        tr3.setApprovedBy(manager);
        tr3.setApprovedAt(LocalDateTime.now().minusDays(10));
        travelRequestRepo.save(tr3);

        // --- SHIPMENTS ---
        Shipment s1 = new Shipment();
        s1.setAssetName("AR Prototype Unit #08");
        s1.setSerialNumber("AVP-2026-X99");
        s1.setDestinationVenue("Tokyo Midtown Hall");
        s1.setSyncedEmployee(emp1);
        s1.setTravelRequest(tr1);
        s1.setTargetDeliveryDate(LocalDate.of(2026, 8, 14));
        s1.setTrackingCode("LOG-JP-884920");
        s1.setStatus("IN_TRANSIT");
        s1.setWeightKg(4.2);
        s1.setShippingCarrier("FedEx International Priority");
        shipmentRepo.save(s1);

        Shipment s2 = new Shipment();
        s2.setAssetName("Secure Edge AI Server Rack");
        s2.setSerialNumber("SRV-884-ENC");
        s2.setDestinationVenue("Frankfurt Hub Center");
        s2.setSyncedEmployee(emp2);
        s2.setTravelRequest(tr2);
        s2.setTargetDeliveryDate(LocalDate.of(2026, 8, 17));
        s2.setTrackingCode("LOG-DE-993214");
        s2.setStatus("CUSTOMS_CLEARANCE");
        s2.setWeightKg(28.5);
        s2.setShippingCarrier("DHL Express");
        shipmentRepo.save(s2);

        // --- NOTIFICATIONS ---
        Notification n1 = new Notification();
        n1.setTitle("Flight JL006 Delayed (45m)");
        n1.setMessage("JAL Flight JL006 to Tokyo Haneda delayed due to weather. Connecting shuttle updated.");
        n1.setSeverity("MEDIUM");
        n1.setCategory("FLIGHT");
        n1.setTargetEmployee(emp1);
        notificationRepo.save(n1);

        Notification n2 = new Notification();
        n2.setTitle("Asset Delivered to Venue");
        n2.setMessage("Prototype #08 delivered and signed by Tokyo Midtown Logistics Desk.");
        n2.setSeverity("INFO");
        n2.setCategory("LOGISTICS");
        n2.setTargetEmployee(emp1);
        notificationRepo.save(n2);

        Notification n3 = new Notification();
        n3.setTitle("Geopolitical Risk Alert: Frankfurt Region");
        n3.setMessage("Transit strike scheduled in Frankfurt on Aug 19. Alternative chauffeur service booked automatically.");
        n3.setSeverity("HIGH");
        n3.setCategory("RISK");
        n3.setTargetEmployee(emp2);
        notificationRepo.save(n3);

        // --- TRAVELER LOCATIONS ---
        TravelerLocation loc1 = new TravelerLocation();
        loc1.setEmployee(emp1);
        loc1.setCity("Tokyo");
        loc1.setCountry("Japan");
        loc1.setLatitude(35.6762);
        loc1.setLongitude(139.6503);
        loc1.setThreatLevel("LOW");
        loc1.setStatus("SAFE");
        travelerLocationRepo.save(loc1);

        TravelerLocation loc2 = new TravelerLocation();
        loc2.setEmployee(emp2);
        loc2.setCity("Frankfurt");
        loc2.setCountry("Germany");
        loc2.setLatitude(50.1109);
        loc2.setLongitude(8.6821);
        loc2.setThreatLevel("MODERATE");
        loc2.setStatus("ALERT");
        loc2.setAdvisoryNotes("Transit strike anticipated Aug 19. Alternative ground transport arranged.");
        travelerLocationRepo.save(loc2);

        TravelerLocation loc3 = new TravelerLocation();
        loc3.setEmployee(emp3);
        loc3.setCity("London");
        loc3.setCountry("United Kingdom");
        loc3.setLatitude(51.5074);
        loc3.setLongitude(-0.1278);
        loc3.setThreatLevel("LOW");
        loc3.setStatus("SAFE");
        travelerLocationRepo.save(loc3);

        // --- EXPENSE CLAIMS ---
        ExpenseClaim ec1 = new ExpenseClaim();
        ec1.setEmployee(emp1);
        ec1.setTravelRequest(tr1);
        ec1.setVendorName("Tokyo Metro Express");
        ec1.setCategory("GROUND_TRANSPORT");
        ec1.setExpenseDate(LocalDate.of(2026, 8, 16));
        ec1.setAmount(48.50);
        ec1.setTaxAmount(4.85);
        ec1.setCurrency("USD");
        ec1.setOcrConfidence(98.4);
        ec1.setAuditStatus("APPROVED_PAYOUT");
        ec1.setAuditedBy(finAdmin);
        ec1.setAuditedAt(LocalDateTime.now().minusDays(1));
        expenseClaimRepo.save(ec1);

        ExpenseClaim ec2 = new ExpenseClaim();
        ec2.setEmployee(emp2);
        ec2.setTravelRequest(tr2);
        ec2.setVendorName("Lufthansa Executive Dining");
        ec2.setCategory("MEALS");
        ec2.setExpenseDate(LocalDate.of(2026, 8, 19));
        ec2.setAmount(185.00);
        ec2.setTaxAmount(24.13);
        ec2.setCurrency("EUR");
        ec2.setOcrConfidence(95.2);
        ec2.setAuditStatus("PENDING_AUDIT");
        expenseClaimRepo.save(ec2);

        System.out.println("=== Database seeded with initial enterprise data ===");
    }
}
