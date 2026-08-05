package com.cbg.travel.controller;

import com.cbg.travel.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        return analyticsService.getDashboardAnalytics();
    }

    /**
     * Department-level travel summary (US-18).
     * Shows YTD spend vs allocated budget, top spending categories.
     */
    @GetMapping("/department/{department}")
    public Map<String, Object> getDepartmentSummary(@PathVariable String department) {
        return analyticsService.getDepartmentSummary(department);
    }

    /**
     * Filterable analytics reports (US-19).
     * Supports date, department, and vendor filters.
     */
    @GetMapping("/reports")
    public Map<String, Object> getReports(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String vendor) {
        return analyticsService.getFilteredReport(startDate, endDate, department, vendor);
    }
}
