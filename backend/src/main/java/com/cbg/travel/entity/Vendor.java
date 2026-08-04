package com.cbg.travel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendors")
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // FLIGHT, HOTEL, GROUND_TRANSPORT

    @Column(nullable = false)
    private Double corporateRate;

    @Column(nullable = false)
    private Double standardRate;

    private Double rating;

    private Boolean preferred = true;

    @Column(length = 500)
    private String badges; // CSV: "Carbon Neutral,Flex Rebooking"

    private String contactEmail;
    private String contactPhone;
    private String region; // APAC, EMEA, AMERICAS, GLOBAL

    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Vendor() {}

    public int getDiscountPercentage() {
        if (standardRate != null && standardRate > 0 && corporateRate != null) {
            return (int) Math.round((1 - corporateRate / standardRate) * 100);
        }
        return 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getCorporateRate() { return corporateRate; }
    public void setCorporateRate(Double corporateRate) { this.corporateRate = corporateRate; }

    public Double getStandardRate() { return standardRate; }
    public void setStandardRate(Double standardRate) { this.standardRate = standardRate; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Boolean getPreferred() { return preferred; }
    public void setPreferred(Boolean preferred) { this.preferred = preferred; }

    public String getBadges() { return badges; }
    public void setBadges(String badges) { this.badges = badges; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
