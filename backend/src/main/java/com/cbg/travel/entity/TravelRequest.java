package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "travel_requests")
public class TravelRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String destination;

    private String countryCode;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 2000)
    private String purpose;

    @Column(nullable = false)
    private Double estimatedBudget;

    @Column(nullable = false)
    private String flightClass; // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST

    @Column(nullable = false)
    private Double hotelDailyRate;

    private Double mealAllowance;
    private Double groundTransportBudget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TravelRequestStatus status = TravelRequestStatus.DRAFT;

    @Column(length = 2000)
    private String policyViolations;

    private Integer policyComplianceScore;

    private Integer roiScore;

    @Column(length = 2000)
    private String managerRemarks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;

    private LocalDateTime approvedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public TravelRequest() {}

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Calculate trip duration in days
    public int getTripDurationDays() {
        if (startDate != null && endDate != null) {
            return (int) (endDate.toEpochDay() - startDate.toEpochDay());
        }
        return 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

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

    public Double getEstimatedBudget() { return estimatedBudget; }
    public void setEstimatedBudget(Double estimatedBudget) { this.estimatedBudget = estimatedBudget; }

    public String getFlightClass() { return flightClass; }
    public void setFlightClass(String flightClass) { this.flightClass = flightClass; }

    public Double getHotelDailyRate() { return hotelDailyRate; }
    public void setHotelDailyRate(Double hotelDailyRate) { this.hotelDailyRate = hotelDailyRate; }

    public Double getMealAllowance() { return mealAllowance; }
    public void setMealAllowance(Double mealAllowance) { this.mealAllowance = mealAllowance; }

    public Double getGroundTransportBudget() { return groundTransportBudget; }
    public void setGroundTransportBudget(Double groundTransportBudget) { this.groundTransportBudget = groundTransportBudget; }

    public TravelRequestStatus getStatus() { return status; }
    public void setStatus(TravelRequestStatus status) { this.status = status; }

    public String getPolicyViolations() { return policyViolations; }
    public void setPolicyViolations(String policyViolations) { this.policyViolations = policyViolations; }

    public Integer getPolicyComplianceScore() { return policyComplianceScore; }
    public void setPolicyComplianceScore(Integer policyComplianceScore) { this.policyComplianceScore = policyComplianceScore; }

    public Integer getRoiScore() { return roiScore; }
    public void setRoiScore(Integer roiScore) { this.roiScore = roiScore; }

    public String getManagerRemarks() { return managerRemarks; }
    public void setManagerRemarks(String managerRemarks) { this.managerRemarks = managerRemarks; }

    public Employee getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Employee approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
