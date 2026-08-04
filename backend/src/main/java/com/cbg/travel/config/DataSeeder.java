package com.cbg.travel.config;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

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

    public DataSeeder(EmployeeRepository employeeRepo,
                      PolicyRuleRepository policyRuleRepo,
                      VendorRepository vendorRepo,
                      TravelRequestRepository travelRequestRepo,
                      ShipmentRepository shipmentRepo,
                      NotificationRepository notificationRepo,
                      TravelerLocationRepository travelerLocationRepo,
                      ExpenseClaimRepository expenseClaimRepo) {
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
        // If official account already exists, skipping
        if (employeeRepo.findByEmail("employee.sarah@cbg-enterprise.com").isPresent()) {
            System.out.println("=== Official accounts already seeded ===");
            return;
        }

        System.out.println("=== Clearing old data and seeding CBG Enterprise Official Accounts & Passkeys ===");

        // Clear existing tables to ensure clean DB state
        try {
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
        employeeRepo.save(emp);

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

        System.out.println("=== DataSeeder complete: Clean official accounts seeded successfully ===");
    }
}
