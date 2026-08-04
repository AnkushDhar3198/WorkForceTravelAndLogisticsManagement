package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expense_claims")
public class ExpenseClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "travel_request_id")
    private TravelRequest travelRequest;

    @Column(nullable = false)
    private String vendorName;

    @Column(nullable = false)
    private String category; // FLIGHT, HOTEL, GROUND_TRANSPORT, MEALS, MISC

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false)
    private Double amount;

    private Double taxAmount;
    private String currency;

    private Double ocrConfidence;

    @Column(nullable = false)
    private String auditStatus; // PENDING_AUDIT, APPROVED_PAYOUT, REJECTED_FLAGGED, UNDER_REVIEW

    @Column(length = 1000)
    private String auditRemarks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "audited_by")
    private Employee auditedBy;

    private LocalDateTime auditedAt;

    private String receiptFileName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public ExpenseClaim() {}

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public TravelRequest getTravelRequest() { return travelRequest; }
    public void setTravelRequest(TravelRequest travelRequest) { this.travelRequest = travelRequest; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Double getOcrConfidence() { return ocrConfidence; }
    public void setOcrConfidence(Double ocrConfidence) { this.ocrConfidence = ocrConfidence; }

    public String getAuditStatus() { return auditStatus; }
    public void setAuditStatus(String auditStatus) { this.auditStatus = auditStatus; }

    public String getAuditRemarks() { return auditRemarks; }
    public void setAuditRemarks(String auditRemarks) { this.auditRemarks = auditRemarks; }

    public Employee getAuditedBy() { return auditedBy; }
    public void setAuditedBy(Employee auditedBy) { this.auditedBy = auditedBy; }

    public LocalDateTime getAuditedAt() { return auditedAt; }
    public void setAuditedAt(LocalDateTime auditedAt) { this.auditedAt = auditedAt; }

    public String getReceiptFileName() { return receiptFileName; }
    public void setReceiptFileName(String receiptFileName) { this.receiptFileName = receiptFileName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
