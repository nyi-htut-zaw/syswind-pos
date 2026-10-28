package com.syswind.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "delivery_providers")
public class DeliveryProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "provider_type", nullable = false, length = 50)
    private String providerType = "THIRD_PARTY";

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(length = 50)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "tracking_url_pattern", columnDefinition = "TEXT")
    private String trackingUrlPattern;

    @Column(name = "base_fee", precision = 15, scale = 2)
    private BigDecimal baseFee = BigDecimal.ZERO;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logo_image_id")
    private StoredImage logoImage;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public DeliveryProvider() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getTrackingUrlPattern() { return trackingUrlPattern; }
    public void setTrackingUrlPattern(String trackingUrlPattern) { this.trackingUrlPattern = trackingUrlPattern; }

    public BigDecimal getBaseFee() { return baseFee; }
    public void setBaseFee(BigDecimal baseFee) { this.baseFee = baseFee; }

    public StoredImage getLogoImage() { return logoImage; }
    public void setLogoImage(StoredImage logoImage) { this.logoImage = logoImage; }

    public String getLogoUrl() {
        if (logoImage != null) return "/api/images/" + logoImage.getId();
        return logoUrl;
    }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
