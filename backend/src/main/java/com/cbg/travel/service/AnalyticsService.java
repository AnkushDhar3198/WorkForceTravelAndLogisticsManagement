package com.cbg.travel.service;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AnalyticsService {

    private final TravelRequestRepository travelRequestRepo;
    private final ExpenseClaimRepository expenseClaimRepo;
    private final EmployeeRepository employeeRepo;
    private final VendorRepository vendorRepo;

    // Simulated department budgets (in production, this would come from a config table)
    private static final Map<String, Double> DEPARTMENT_BUDGETS = Map.of(
            "Engineering", 250000.0,
            "Engineering & Product", 300000.0,
            "Global Corporate Travel", 500000.0,
            "Finance & Procurement", 150000.0,
            "Enterprise Security", 200000.0,
            "Global Logistics Operations", 180000.0,
            "Marketing", 200000.0,
            "Sales", 350000.0,
            "General", 100000.0
    );

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
            item.put("budget", DEPARTMENT_BUDGETS.getOrDefault((String) row[0], 200000.0));
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

        // Spend by vendor (US-19)
        List<Map<String, Object>> vendorSpend = new ArrayList<>();
        List<ExpenseClaim> allExpenses = expenseClaimRepo.findAllByOrderByCreatedAtDesc();
        Map<String, Double> vendorMap = new LinkedHashMap<>();
        allExpenses.forEach(e -> vendorMap.merge(e.getVendorName(), e.getAmount(), Double::sum));
        vendorMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("vendor", entry.getKey());
                    v.put("spend", entry.getValue());
                    vendorSpend.add(v);
                });
        analytics.put("spendByVendor", vendorSpend);

        // Monthly spend trend (US-19)
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        List<TravelRequest> allRequests = travelRequestRepo.findAllByOrderByCreatedAtDesc();
        Map<String, Double> monthMap = new LinkedHashMap<>();
        allRequests.stream()
                .filter(r -> r.getStatus() == TravelRequestStatus.APPROVED || r.getStatus() == TravelRequestStatus.COMPLETED)
                .forEach(r -> {
                    String month = r.getCreatedAt().toLocalDate().withDayOfMonth(1).toString();
                    monthMap.merge(month, r.getEstimatedBudget(), Double::sum);
                });
        monthMap.forEach((month, spend) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", month);
            m.put("spend", spend);
            monthlyTrend.add(m);
        });
        analytics.put("monthlyTrend", monthlyTrend);

        // Violation trend (US-19)
        Map<String, Long> violationTrend = new LinkedHashMap<>();
        allRequests.stream()
                .filter(r -> r.getPolicyViolations() != null && !r.getPolicyViolations().isEmpty())
                .forEach(r -> {
                    String month = r.getCreatedAt().toLocalDate().withDayOfMonth(1).toString();
                    violationTrend.merge(month, 1L, Long::sum);
                });
        analytics.put("violationTrend", violationTrend);

        // YTD totals (US-18)
        LocalDate ytdStart = LocalDate.now().withDayOfYear(1);
        double ytdSpend = allRequests.stream()
                .filter(r -> (r.getStatus() == TravelRequestStatus.APPROVED || r.getStatus() == TravelRequestStatus.COMPLETED)
                        && r.getCreatedAt().toLocalDate().isAfter(ytdStart.minusDays(1)))
                .mapToDouble(r -> r.getEstimatedBudget() != null ? r.getEstimatedBudget() : 0)
                .sum();
        double totalBudget = DEPARTMENT_BUDGETS.values().stream().mapToDouble(Double::doubleValue).sum();
        analytics.put("ytdSpend", ytdSpend);
        analytics.put("totalAllocatedBudget", totalBudget);

        return analytics;
    }

    /**
     * Department-level summary (US-18).
     * YTD travel spend vs allocated budget, top spending categories.
     */
    public Map<String, Object> getDepartmentSummary(String department) {
        Map<String, Object> summary = new LinkedHashMap<>();

        double allocatedBudget = DEPARTMENT_BUDGETS.getOrDefault(department, 200000.0);
        summary.put("department", department);
        summary.put("allocatedBudget", allocatedBudget);

        List<TravelRequest> allRequests = travelRequestRepo.findAllByOrderByCreatedAtDesc();
        List<TravelRequest> deptRequests = allRequests.stream()
                .filter(r -> department.equals(r.getEmployee().getDepartment()))
                .collect(Collectors.toList());

        double totalSpend = deptRequests.stream()
                .filter(r -> r.getStatus() == TravelRequestStatus.APPROVED || r.getStatus() == TravelRequestStatus.COMPLETED)
                .mapToDouble(r -> r.getEstimatedBudget() != null ? r.getEstimatedBudget() : 0)
                .sum();

        summary.put("ytdSpend", totalSpend);
        summary.put("remainingBudget", allocatedBudget - totalSpend);
        summary.put("utilizationPercent", allocatedBudget > 0 ? Math.round((totalSpend / allocatedBudget) * 1000.0) / 10.0 : 0);
        summary.put("pendingReimbursements", deptRequests.stream()
                .filter(r -> r.getStatus() == TravelRequestStatus.PENDING_APPROVAL).count());
        summary.put("totalRequests", deptRequests.size());
        summary.put("activeTrips", deptRequests.stream()
                .filter(r -> r.getStatus() == TravelRequestStatus.APPROVED &&
                        r.getStartDate() != null && r.getEndDate() != null &&
                        !LocalDate.now().isBefore(r.getStartDate()) &&
                        !LocalDate.now().isAfter(r.getEndDate()))
                .count());

        // Top spending categories for department
        List<ExpenseClaim> allExpenses = expenseClaimRepo.findAllByOrderByCreatedAtDesc();
        Map<String, Double> catMap = new LinkedHashMap<>();
        allExpenses.stream()
                .filter(e -> department.equals(e.getEmployee().getDepartment()))
                .forEach(e -> catMap.merge(e.getCategory(), e.getAmount(), Double::sum));
        List<Map<String, Object>> topCategories = new ArrayList<>();
        catMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .forEach(entry -> {
                    Map<String, Object> c = new LinkedHashMap<>();
                    c.put("category", entry.getKey());
                    c.put("spend", entry.getValue());
                    topCategories.add(c);
                });
        summary.put("topCategories", topCategories);

        return summary;
    }

    /**
     * Filterable analytics reports (US-19).
     */
    public Map<String, Object> getFilteredReport(String startDate, String endDate, String department, String vendor) {
        Map<String, Object> report = new LinkedHashMap<>();

        List<TravelRequest> allRequests = travelRequestRepo.findAllByOrderByCreatedAtDesc();
        List<ExpenseClaim> allExpenses = expenseClaimRepo.findAllByOrderByCreatedAtDesc();

        // Apply date filter
        if (startDate != null && !startDate.isEmpty()) {
            LocalDate start = LocalDate.parse(startDate);
            allRequests = allRequests.stream()
                    .filter(r -> !r.getCreatedAt().toLocalDate().isBefore(start))
                    .collect(Collectors.toList());
            allExpenses = allExpenses.stream()
                    .filter(e -> !e.getExpenseDate().isBefore(start))
                    .collect(Collectors.toList());
        }
        if (endDate != null && !endDate.isEmpty()) {
            LocalDate end = LocalDate.parse(endDate);
            allRequests = allRequests.stream()
                    .filter(r -> !r.getCreatedAt().toLocalDate().isAfter(end))
                    .collect(Collectors.toList());
            allExpenses = allExpenses.stream()
                    .filter(e -> !e.getExpenseDate().isAfter(end))
                    .collect(Collectors.toList());
        }

        // Apply department filter
        if (department != null && !department.isEmpty()) {
            allRequests = allRequests.stream()
                    .filter(r -> department.equals(r.getEmployee().getDepartment()))
                    .collect(Collectors.toList());
            allExpenses = allExpenses.stream()
                    .filter(e -> department.equals(e.getEmployee().getDepartment()))
                    .collect(Collectors.toList());
        }

        // Apply vendor filter
        if (vendor != null && !vendor.isEmpty()) {
            allExpenses = allExpenses.stream()
                    .filter(e -> e.getVendorName() != null && e.getVendorName().toLowerCase().contains(vendor.toLowerCase()))
                    .collect(Collectors.toList());
        }

        // Build report
        report.put("totalRequests", allRequests.size());
        report.put("totalExpenses", allExpenses.size());
        report.put("totalTravelSpend", allRequests.stream()
                .filter(r -> r.getStatus() == TravelRequestStatus.APPROVED || r.getStatus() == TravelRequestStatus.COMPLETED)
                .mapToDouble(r -> r.getEstimatedBudget() != null ? r.getEstimatedBudget() : 0).sum());
        report.put("totalExpenseSpend", allExpenses.stream().mapToDouble(ExpenseClaim::getAmount).sum());

        long violations = allRequests.stream()
                .filter(r -> r.getPolicyViolations() != null && !r.getPolicyViolations().isEmpty()).count();
        report.put("policyViolations", violations);
        report.put("complianceRate", allRequests.size() > 0 ?
                Math.round(((double)(allRequests.size() - violations) / allRequests.size()) * 1000.0) / 10.0 : 100.0);

        // Spend by vendor
        Map<String, Double> vendorSpend = new LinkedHashMap<>();
        allExpenses.forEach(e -> vendorSpend.merge(e.getVendorName(), e.getAmount(), Double::sum));
        List<Map<String, Object>> vendorList = new ArrayList<>();
        vendorSpend.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .forEach(entry -> {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("vendor", entry.getKey());
                    v.put("spend", entry.getValue());
                    vendorList.add(v);
                });
        report.put("spendByVendor", vendorList);

        // Monthly breakdown
        Map<String, Double> monthly = new LinkedHashMap<>();
        allExpenses.forEach(e -> {
            String month = e.getExpenseDate().withDayOfMonth(1).toString();
            monthly.merge(month, e.getAmount(), Double::sum);
        });
        report.put("monthlyBreakdown", monthly);

        return report;
    }
}
