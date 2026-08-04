package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "travel_requests")
public class TravelRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeName;
    private String employeeRole;
    private String destination;
    private String countryCode;
    private LocalDate startDate;
    private LocalDate endDate;
    @Column(length = 1000)
    private String purpose;
    private Double estimatedCost;
    private String flightClass;
    private Double hotelDailyRate;
    private String status; // PENDING_APPROVAL, APPROVED, REJECTED, POLICY_VIOLATION
    private String policyViolations;
    private Integer roiScore;
    private LocalDate createdAt;

    public TravelRequest() {}

    public TravelRequest(Long id, String employeeName, String employeeRole, String destination, String countryCode, LocalDate startDate, LocalDate endDate, String purpose, Double estimatedCost, String flightClass, Double hotelDailyRate, String status, String policyViolations, Integer roiScore, LocalDate createdAt) {
        this.id = id;
        this.employeeName = employeeName;
        this.employeeRole = employeeRole;
        this.destination = destination;
        this.countryCode = countryCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.purpose = purpose;
        this.estimatedCost = estimatedCost;
        this.flightClass = flightClass;
        this.hotelDailyRate = hotelDailyRate;
        this.status = status;
        this.policyViolations = policyViolations;
        this.roiScore = roiScore;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeRole() { return employeeRole; }
    public void setEmployeeRole(String employeeRole) { this.employeeRole = employeeRole; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Double estimatedCost) { this.estimatedCost = estimatedCost; }

    public String getFlightClass() { return flightClass; }
    public void setFlightClass(String flightClass) { this.flightClass = flightClass; }

    public Double getHotelDailyRate() { return hotelDailyRate; }
    public void setHotelDailyRate(Double hotelDailyRate) { this.hotelDailyRate = hotelDailyRate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPolicyViolations() { return policyViolations; }
    public void setPolicyViolations(String policyViolations) { this.policyViolations = policyViolations; }

    public Integer getRoiScore() { return roiScore; }
    public void setRoiScore(Integer roiScore) { this.roiScore = roiScore; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
