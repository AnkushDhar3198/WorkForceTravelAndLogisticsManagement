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
    private final BookingRepository bookingRepo;
    private final AuditLogRepository auditLogRepo;
    private final TravelDocumentRepository documentRepo;

    public DataSeeder(EmployeeRepository employeeRepo,
                      PolicyRuleRepository policyRuleRepo,
                      VendorRepository vendorRepo,
                      TravelRequestRepository travelRequestRepo,
                      ShipmentRepository shipmentRepo,
                      NotificationRepository notificationRepo,
                      TravelerLocationRepository travelerLocationRepo,
                      ExpenseClaimRepository expenseClaimRepo,
                      BookingRepository bookingRepo,
                      AuditLogRepository auditLogRepo,
                      TravelDocumentRepository documentRepo) {
        this.employeeRepo = employeeRepo;
        this.policyRuleRepo = policyRuleRepo;
        this.vendorRepo = vendorRepo;
        this.travelRequestRepo = travelRequestRepo;
        this.shipmentRepo = shipmentRepo;
        this.notificationRepo = notificationRepo;
        this.travelerLocationRepo = travelerLocationRepo;
        this.expenseClaimRepo = expenseClaimRepo;
        this.bookingRepo = bookingRepo;
        this.auditLogRepo = auditLogRepo;
        this.documentRepo = documentRepo;
    }

    @Override
    public void run(String... args) {
        // If official account already exists, skipping
        if (employeeRepo.findByEmail("employee.sarah@cbg-enterprise.com").isPresent()) {
            System.out.println("=== Official accounts already seeded ===");
            return;
        }

        System.out.println("=== Clearing old data and seeding CBG Enterprise Official Accounts & Passkeys ===");

        // Clear existing tables to ensure clean DB state
        try {
            auditLogRepo.deleteAllInBatch();
            bookingRepo.deleteAllInBatch();
            documentRepo.deleteAllInBatch();
            expenseClaimRepo.deleteAllInBatch();
            shipmentRepo.deleteAllInBatch();
            notificationRepo.deleteAllInBatch();
            travelerLocationRepo.deleteAllInBatch();
            travelRequestRepo.deleteAllInBatch();
            employeeRepo.deleteAllInBatch();
        } catch (Exception e) {
            System.out.println("Clean database initialization: " + e.getMessage());
        }

        // 1. Corporate Travel Manager (Program Owner)
        Employee ctm = new Employee();
        ctm.setEmployeeCode("OFFICIAL-CTM-01");
        ctm.setFirstName("Victoria");
        ctm.setLastName("Vance");
        ctm.setEmail("travel.manager@cbg-enterprise.com");
        ctm.setPasskey("CTM-9948-ALPHA");
        ctm.setTwoFactorCode("774892");
        ctm.setPassword("CTM-9948-ALPHA");
        ctm.setPhone("+1-800-555-0101");
        ctm.setRole(UserRole.CORPORATE_TRAVEL_MANAGER);
        ctm.setDepartment("Global Corporate Travel");
        ctm.setDesignation("Global Travel Program Director");
        ctm.setNationality("US");
        employeeRepo.save(ctm);

        // 2. Approving Manager (Department Leader)
        Employee mgr = new Employee();
        mgr.setEmployeeCode("OFFICIAL-MGR-01");
        mgr.setFirstName("David");
        mgr.setLastName("Chen");
        mgr.setEmail("manager.david@cbg-enterprise.com");
        mgr.setPasskey("MGR-3381-BETA");
        mgr.setTwoFactorCode("882194");
        mgr.setPassword("MGR-3381-BETA");
        mgr.setPhone("+1-415-555-0102");
        mgr.setRole(UserRole.APPROVING_MANAGER);
        mgr.setDepartment("Engineering & Product");
        mgr.setDesignation("VP Engineering & Travel Approver");
        mgr.setNationality("US");
        mgr = employeeRepo.save(mgr);

        // 3. Finance & Procurement Team (Budget & Audit Overseer)
        Employee fin = new Employee();
        fin.setEmployeeCode("OFFICIAL-FIN-01");
        fin.setFirstName("Lisa");
        fin.setLastName("Park");
        fin.setEmail("finance.lisa@cbg-enterprise.com");
        fin.setPasskey("FIN-5510-GAMMA");
        fin.setTwoFactorCode("551930");
        fin.setPassword("FIN-5510-GAMMA");
        fin.setPhone("+1-415-555-0401");
        fin.setRole(UserRole.FINANCE_ADMIN);
        fin.setDepartment("Finance & Procurement");
        fin.setDesignation("Finance Director");
        fin.setNationality("US");
        employeeRepo.save(fin);

        // 4. Security / Risk Officer (Duty of Care Primary Responder)
        Employee sec = new Employee();
        sec.setEmployeeCode("OFFICIAL-SEC-01");
        sec.setFirstName("Elena");
        sec.setLastName("Rostova");
        sec.setEmail("security.elena@cbg-enterprise.com");
        sec.setPasskey("SEC-7742-DELTA");
        sec.setTwoFactorCode("993418");
        sec.setPassword("SEC-7742-DELTA");
        sec.setPhone("+44-20-5555-0103");
        sec.setRole(UserRole.RISK_OFFICER);
        sec.setDepartment("Enterprise Security");
        sec.setDesignation("Global Risk & Safety Director");
        sec.setNationality("GB");
        employeeRepo.save(sec);

        // 5. Logistics Coordinator (Asset & Prototype Transport Lead)
        Employee log = new Employee();
        log.setEmployeeCode("OFFICIAL-LOG-01");
        log.setFirstName("Raj");
        log.setLastName("Patel");
        log.setEmail("logistics.raj@cbg-enterprise.com");
        log.setPasskey("LOG-1193-EPSILON");
        log.setTwoFactorCode("448201");
        log.setPassword("LOG-1193-EPSILON");
        log.setPhone("+91-98765-43210");
        log.setRole(UserRole.LOGISTICS_COORDINATOR);
        log.setDepartment("Global Logistics Operations");
        log.setDesignation("Senior Logistics Coordinator");
        log.setNationality("IN");
        employeeRepo.save(log);

        // 6. Traveling Employee (Road Warrior / Field User)
        Employee emp = new Employee();
        emp.setEmployeeCode("OFFICIAL-EMP-01");
        emp.setFirstName("Sarah");
        emp.setLastName("Jenkins");
        emp.setEmail("employee.sarah@cbg-enterprise.com");
        emp.setPasskey("EMP-4421-ZETA");
        emp.setTwoFactorCode("123984");
        emp.setPassword("EMP-4421-ZETA");
        emp.setPhone("+1-415-555-0201");
        emp.setRole(UserRole.EMPLOYEE);
        emp.setDepartment("Engineering");
        emp.setDesignation("Senior Field Engineer");
        emp.setNationality("US");
        emp.setPassportNumber("US9384756");
        emp.setManagerId(mgr.getId());
        emp = employeeRepo.save(emp);

        // 7. System Administrator (Audit Log Access)
        Employee admin = new Employee();
        admin.setEmployeeCode("OFFICIAL-ADMIN-01");
        admin.setFirstName("Marcus");
        admin.setLastName("Webb");
        admin.setEmail("admin.marcus@cbg-enterprise.com");
        admin.setPasskey("ADM-8871-OMEGA");
        admin.setTwoFactorCode("667233");
        admin.setPassword("ADM-8871-OMEGA");
        admin.setPhone("+1-800-555-0909");
        admin.setRole(UserRole.SYSTEM_ADMIN);
        admin.setDepartment("IT Administration");
        admin.setDesignation("System Administrator");
        admin.setNationality("US");
        admin = employeeRepo.save(admin);

        // --- POLICY ENGINE RULES ---
        if (policyRuleRepo.count() == 0) {
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
        }

        // --- PREFERRED CORPORATE VENDORS ---
        if (vendorRepo.count() == 0) {
            Vendor v1 = new Vendor(); v1.setName("Japan Airlines (JAL)"); v1.setCategory("FLIGHT"); v1.setCorporateRate(1250.0); v1.setStandardRate(1800.0); v1.setRating(4.9); v1.setBadges("Preferred Partner,Carbon Neutral"); v1.setRegion("APAC"); vendorRepo.save(v1);
            Vendor v2 = new Vendor(); v2.setName("Lufthansa Group"); v2.setCategory("FLIGHT"); v2.setCorporateRate(1400.0); v2.setStandardRate(1950.0); v2.setRating(4.8); v2.setBadges("Flex Rebooking,Priority Lounge"); v2.setRegion("EMEA"); vendorRepo.save(v2);
            Vendor v3 = new Vendor(); v3.setName("Delta Airlines"); v3.setCategory("FLIGHT"); v3.setCorporateRate(980.0); v3.setStandardRate(1450.0); v3.setRating(4.6); v3.setBadges("SkyMiles Partnership,Wi-Fi Included"); v3.setRegion("AMERICAS"); vendorRepo.save(v3);
            Vendor v4 = new Vendor(); v4.setName("Park Hyatt"); v4.setCategory("HOTEL"); v4.setCorporateRate(280.0); v4.setStandardRate(450.0); v4.setRating(4.9); v4.setBadges("Includes Breakfast,Late Checkout"); v4.setRegion("GLOBAL"); vendorRepo.save(v4);
            Vendor v5 = new Vendor(); v5.setName("Marriott International"); v5.setCategory("HOTEL"); v5.setCorporateRate(220.0); v5.setStandardRate(380.0); v5.setRating(4.7); v5.setBadges("Corporate Partner,Executive Club"); v5.setRegion("GLOBAL"); vendorRepo.save(v5);
            Vendor v6 = new Vendor(); v6.setName("Sixt Executive"); v6.setCategory("GROUND_TRANSPORT"); v6.setCorporateRate(110.0); v6.setStandardRate(160.0); v6.setRating(4.8); v6.setBadges("EV Fleet,Instant Dispatch"); v6.setRegion("EMEA"); vendorRepo.save(v6);
        }

        // --- SEED TRAVEL REQUEST (for bookings demo) ---
        TravelRequest tr = new TravelRequest();
        tr.setEmployee(emp);
        tr.setRequestId("TR-20260801-AB12");
        tr.setDestination("Tokyo, Japan");
        tr.setCountryCode("JP");
        tr.setStartDate(LocalDate.now().plusDays(5));
        tr.setEndDate(LocalDate.now().plusDays(12));
        tr.setPurpose("Client partnership summit and product demo at Tokyo Tech Center");
        tr.setEstimatedBudget(6500.0);
        tr.setFlightClass("ECONOMY");
        tr.setHotelDailyRate(280.0);
        tr.setMealAllowance(75.0);
        tr.setGroundTransportBudget(200.0);
        tr.setStatus(TravelRequestStatus.APPROVED);
        tr.setPolicyComplianceScore(100);
        tr.setRoiScore(90);
        tr.setApprovedBy(mgr);
        tr.setApprovedAt(LocalDateTime.now().minusDays(2));
        tr = travelRequestRepo.save(tr);

        // --- SEED BOOKINGS (US-08 demo data) ---
        if (bookingRepo.count() == 0) {
            Booking flightBooking = new Booking();
            flightBooking.setTravelRequest(tr);
            flightBooking.setEmployee(emp);
            flightBooking.setBookingType("FLIGHT");
            flightBooking.setPnrCode("PNR-X7K92A");
            flightBooking.setConfirmationNumber("DL-2026-98741");
            flightBooking.setVendorName("Delta Airlines");
            flightBooking.setBookingDate(LocalDate.now().minusDays(1));
            flightBooking.setDepartureAirport("SFO");
            flightBooking.setArrivalAirport("NRT");
            flightBooking.setDepartureDateTime(LocalDateTime.now().plusDays(5).withHour(10).withMinute(30));
            flightBooking.setArrivalDateTime(LocalDateTime.now().plusDays(6).withHour(14).withMinute(0));
            flightBooking.setFlightNumber("DL 275");
            flightBooking.setCabinClass("ECONOMY");
            flightBooking.setSeatNumber("24A");
            flightBooking.setAmount(1250.0);
            flightBooking.setStatus("CONFIRMED");
            bookingRepo.save(flightBooking);

            Booking hotelBooking = new Booking();
            hotelBooking.setTravelRequest(tr);
            hotelBooking.setEmployee(emp);
            hotelBooking.setBookingType("HOTEL");
            hotelBooking.setPnrCode("PNR-H3M81B");
            hotelBooking.setConfirmationNumber("PH-TKY-440291");
            hotelBooking.setVendorName("Park Hyatt Tokyo");
            hotelBooking.setBookingDate(LocalDate.now().minusDays(1));
            hotelBooking.setHotelName("Park Hyatt Tokyo");
            hotelBooking.setCheckInDate(LocalDate.now().plusDays(6));
            hotelBooking.setCheckOutDate(LocalDate.now().plusDays(12));
            hotelBooking.setRoomType("Deluxe King");
            hotelBooking.setAmount(1960.0);
            hotelBooking.setStatus("CONFIRMED");
            bookingRepo.save(hotelBooking);

            Booking transportBooking = new Booking();
            transportBooking.setTravelRequest(tr);
            transportBooking.setEmployee(emp);
            transportBooking.setBookingType("TRANSPORT");
            transportBooking.setPnrCode("PNR-T9R44C");
            transportBooking.setVendorName("Sixt Executive Japan");
            transportBooking.setBookingDate(LocalDate.now().minusDays(1));
            transportBooking.setVehicleType("Executive Sedan");
            transportBooking.setPickupLocation("NRT Airport Terminal 1");
            transportBooking.setDropLocation("Park Hyatt Tokyo, Shinjuku");
            transportBooking.setAmount(180.0);
            transportBooking.setStatus("CONFIRMED");
            bookingRepo.save(transportBooking);
        }

        // --- SEED TRAVEL DOCUMENTS (US-02 demo data) ---
        if (documentRepo.count() == 0) {
            TravelDocument passport = new TravelDocument();
            passport.setEmployee(emp);
            passport.setDocumentType("PASSPORT");
            passport.setFileName("passport_sarah_jenkins.pdf");
            passport.setFileSize(245000L);
            passport.setContentType("application/pdf");
            passport.setExpiryDate(LocalDate.of(2029, 3, 15));
            passport.setDescription("US Passport — Sarah Jenkins");
            passport.setEncryptedContent(""); // Empty content for demo
            documentRepo.save(passport);

            TravelDocument visa = new TravelDocument();
            visa.setEmployee(emp);
            visa.setDocumentType("VISA");
            visa.setFileName("japan_business_visa.pdf");
            visa.setFileSize(182000L);
            visa.setContentType("application/pdf");
            visa.setExpiryDate(LocalDate.of(2027, 6, 30));
            visa.setDescription("Japan Business Visa — Multiple Entry");
            visa.setEncryptedContent("");
            documentRepo.save(visa);

            TravelDocument insurance = new TravelDocument();
            insurance.setEmployee(emp);
            insurance.setDocumentType("INSURANCE");
            insurance.setFileName("cigna_travel_insurance.pdf");
            insurance.setFileSize(310000L);
            insurance.setContentType("application/pdf");
            insurance.setExpiryDate(LocalDate.of(2026, 12, 31));
            insurance.setDescription("Cigna Global Executive Travel Insurance");
            insurance.setEncryptedContent("");
            documentRepo.save(insurance);
        }

        // --- SEED AUDIT LOGS (US-20 demo data) ---
        if (auditLogRepo.count() == 0) {
            auditLogRepo.save(new AuditLog(emp.getId(), "Sarah Jenkins", "EMPLOYEE", "LOGIN", "EMPLOYEE", emp.getId().toString(), "Employee login from corporate VPN", "10.0.1.45"));
            auditLogRepo.save(new AuditLog(emp.getId(), "Sarah Jenkins", "EMPLOYEE", "CREATE", "TRAVEL_REQUEST", "TR-20260801-AB12", "Travel request to Tokyo, Japan ($6,500)", "10.0.1.45"));
            auditLogRepo.save(new AuditLog(mgr.getId(), "David Chen", "APPROVING_MANAGER", "LOGIN", "EMPLOYEE", mgr.getId().toString(), "Manager login", "10.0.2.101"));
            auditLogRepo.save(new AuditLog(mgr.getId(), "David Chen", "APPROVING_MANAGER", "APPROVE", "TRAVEL_REQUEST", "TR-20260801-AB12", "Approved travel request to Tokyo", "10.0.2.101"));
            auditLogRepo.save(new AuditLog(emp.getId(), "Sarah Jenkins", "EMPLOYEE", "CREATE", "BOOKING", "PNR-X7K92A", "Booked Delta Airlines flight SFO→NRT", "10.0.1.45"));
            auditLogRepo.save(new AuditLog(emp.getId(), "Sarah Jenkins", "EMPLOYEE", "CREATE", "DOCUMENT", "1", "Uploaded Passport: passport_sarah_jenkins.pdf", "10.0.1.45"));
            auditLogRepo.save(new AuditLog(admin.getId(), "Marcus Webb", "SYSTEM_ADMIN", "LOGIN", "EMPLOYEE", admin.getId().toString(), "Admin login for audit review", "10.0.0.1"));
        }

        // --- SEED TRAVELER LOCATIONS (for risk map demo) ---
        if (travelerLocationRepo.count() == 0) {
            TravelerLocation loc1 = new TravelerLocation();
            loc1.setEmployee(emp);
            loc1.setCity("Tokyo");
            loc1.setCountry("Japan");
            loc1.setLatitude(35.6762);
            loc1.setLongitude(139.6503);
            loc1.setThreatLevel("LOW");
            loc1.setStatus("SAFE");
            loc1.setAdvisoryNotes("Low risk region. Standard precautions apply.");
            travelerLocationRepo.save(loc1);
        }

        System.out.println("=== DataSeeder complete: All accounts, bookings, documents, and audit logs seeded ===");
    }
}
