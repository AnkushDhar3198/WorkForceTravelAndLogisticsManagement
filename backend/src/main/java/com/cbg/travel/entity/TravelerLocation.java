package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "traveler_locations")
public class TravelerLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private String threatLevel; // LOW, MODERATE, HIGH, CRITICAL

    @Column(nullable = false)
    private String status; // SAFE, ALERT, ASSISTANCE_REQUESTED, EVACUATED

    @Column(length = 1000)
    private String advisoryNotes;

    @Column(nullable = false)
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public TravelerLocation() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getThreatLevel() { return threatLevel; }
    public void setThreatLevel(String threatLevel) { this.threatLevel = threatLevel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAdvisoryNotes() { return advisoryNotes; }
    public void setAdvisoryNotes(String advisoryNotes) { this.advisoryNotes = advisoryNotes; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
