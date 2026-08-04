package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String assetName;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false)
    private String destinationVenue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "synced_employee_id")
    private Employee syncedEmployee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "travel_request_id")
    private TravelRequest travelRequest;

    @Column(nullable = false)
    private LocalDate targetDeliveryDate;

    @Column(nullable = false, unique = true)
    private String trackingCode;

    @Column(nullable = false)
    private String status; // PREPARING, IN_TRANSIT, CUSTOMS_CLEARANCE, DELIVERED, DELAYED, RETURNED

    @Column(length = 1000)
    private String notes;

    private Double weightKg;
    private String shippingCarrier;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Shipment() {}

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getDestinationVenue() { return destinationVenue; }
    public void setDestinationVenue(String destinationVenue) { this.destinationVenue = destinationVenue; }

    public Employee getSyncedEmployee() { return syncedEmployee; }
    public void setSyncedEmployee(Employee syncedEmployee) { this.syncedEmployee = syncedEmployee; }

    public TravelRequest getTravelRequest() { return travelRequest; }
    public void setTravelRequest(TravelRequest travelRequest) { this.travelRequest = travelRequest; }

    public LocalDate getTargetDeliveryDate() { return targetDeliveryDate; }
    public void setTargetDeliveryDate(LocalDate targetDeliveryDate) { this.targetDeliveryDate = targetDeliveryDate; }

    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public String getShippingCarrier() { return shippingCarrier; }
    public void setShippingCarrier(String shippingCarrier) { this.shippingCarrier = shippingCarrier; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
