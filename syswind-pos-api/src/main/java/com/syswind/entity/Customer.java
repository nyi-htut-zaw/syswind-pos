package com.syswind.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(name = "alternate_phone", length = 50)
    private String alternatePhone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "state_division", length = 100)
    private String stateDivision = "Yangon";

    @Column(length = 100)
    private String city = "Yangon";

    @Column(length = 100)
    private String township;

    @Column(name = "customer_tier", length = 50)
    private String customerTier = "STANDARD";

    @Column(name = "total_orders")
    private Integer totalOrders = 0;

    @Column(name = "total_spent", precision = 15, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Customer() {}

    public Customer(String name, String phone, String address, String township, Organization org) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.township = township;
        this.organization = org;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStateDivision() { return stateDivision; }
    public void setStateDivision(String stateDivision) { this.stateDivision = stateDivision; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getTownship() { return township; }
    public void setTownship(String township) { this.township = township; }

    public String getCustomerTier() { return customerTier; }
    public void setCustomerTier(String customerTier) { this.customerTier = customerTier; }

    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
