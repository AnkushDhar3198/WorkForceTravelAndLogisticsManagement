package com.cbg.travel.service;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AnalyticsService {

    private final TravelRequestRepository travelRequestRepo;
    private final ExpenseClaimRepository expenseClaimRepo;
    private final EmployeeRepository employeeRepo;
    private final VendorRepository vendorRepo;

    public AnalyticsService(TravelRequestRepository travelRequestRepo,
                            ExpenseClaimRepository expenseClaimRepo,
                            EmployeeRepository employeeRepo,
                            VendorRepository vendorRepo) {
        this.travelRequestRepo = travelRequestRepo;
        this.expenseClaimRepo = expenseClaimRepo;
        this.employeeRepo = employeeRepo;
        this.vendorRepo = vendorRepo;
    }

    public Map<String, Object> getDashboardAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();

        // KPIs
        analytics.put("totalApprovedSpend", travelRequestRepo.getTotalApprovedSpend());
        analytics.put("activeTripsCount", travelRequestRepo.getActiveTripsCount());
        analytics.put("totalReimbursed", expenseClaimRepo.getTotalReimbursedAmount());

        // Policy compliance rate
        Long totalRequests = travelRequestRepo.getTotalRequestCount();
        Long violationCount = travelRequestRepo.getPolicyViolationCount();
        double complianceRate = totalRequests > 0 ? ((double) (totalRequests - violationCount) / totalRequests) * 100 : 100;
        analytics.put("policyComplianceRate", Math.round(complianceRate * 10.0) / 10.0);

        // Corporate savings estimate
        List<Vendor> preferredVendors = vendorRepo.findByPreferredTrueAndActiveTrue();
        double totalSavings = preferredVendors.stream()
                .mapToDouble(v -> (v.getStandardRate() - v.getCorporateRate()))
                .sum();
        analytics.put("estimatedCorporateSavings", totalSavings);

        // Spend by department
        List<Object[]> deptSpend = travelRequestRepo.getSpendByDepartment();
        List<Map<String, Object>> deptList = new ArrayList<>();
        for (Object[] row : deptSpend) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("department", row[0]);
            item.put("spend", row[1]);
            deptList.add(item);
        }
        analytics.put("spendByDepartment", deptList);

        // Spend by category
        List<Object[]> catSpend = expenseClaimRepo.getSpendByCategory();
        List<Map<String, Object>> catList = new ArrayList<>();
        for (Object[] row : catSpend) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("category", row[0]);
            item.put("spend", row[1]);
            catList.add(item);
        }
        analytics.put("spendByCategory", catList);

        return analytics;
    }
}
