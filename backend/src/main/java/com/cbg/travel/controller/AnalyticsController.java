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
}
