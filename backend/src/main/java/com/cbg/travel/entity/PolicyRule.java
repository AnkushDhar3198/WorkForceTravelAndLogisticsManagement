package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "policy_rules")
public class PolicyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ruleName;

    @Column(nullable = false)
    private String ruleType; // HOTEL_CAP, FLIGHT_CLASS, ADVANCE_BOOKING, VENDOR_PREFERENCE

    private String regionCode; // null = global, ISO code = region-specific

    private Double thresholdValue;

    @Column(nullable = false)
    private String comparisonOperator; // GT, LT, EQ, IN, NOT_IN

    private String allowedValues; // CSV for IN/NOT_IN rules e.g. "ECONOMY,PREMIUM_ECONOMY"

    @Column(nullable = false)
    private String severityLevel; // WARNING, BLOCK, REQUIRES_APPROVAL

    @Column(length = 500)
    private String violationMessage;

    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PolicyRule() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }

    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }

    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }

    public Double getThresholdValue() { return thresholdValue; }
    public void setThresholdValue(Double thresholdValue) { this.thresholdValue = thresholdValue; }

    public String getComparisonOperator() { return comparisonOperator; }
    public void setComparisonOperator(String comparisonOperator) { this.comparisonOperator = comparisonOperator; }

    public String getAllowedValues() { return allowedValues; }
    public void setAllowedValues(String allowedValues) { this.allowedValues = allowedValues; }

    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }

    public String getViolationMessage() { return violationMessage; }
    public void setViolationMessage(String violationMessage) { this.violationMessage = violationMessage; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
