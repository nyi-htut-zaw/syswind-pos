package com.syswind.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logo_image_id")
    private StoredImage logoImage;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(length = 50)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city = "Yangon";

    @Column(name = "state_division", length = 100)
    private String stateDivision = "Yangon";

    @Column(name = "tax_number", length = 50)
    private String taxNumber;

    @Column(length = 10)
    private String currency = "MMK";

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Organization() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public StoredImage getLogoImage() { return logoImage; }
    public void setLogoImage(StoredImage logoImage) { this.logoImage = logoImage; }

    public String getLogoUrl() {
        if (logoImage != null) {
            return "/api/images/" + logoImage.getId();
        }
        return logoUrl;
    }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getStateDivision() { return stateDivision; }
    public void setStateDivision(String stateDivision) { this.stateDivision = stateDivision; }

    public String getTaxNumber() { return taxNumber; }
    public void setTaxNumber(String taxNumber) { this.taxNumber = taxNumber; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
