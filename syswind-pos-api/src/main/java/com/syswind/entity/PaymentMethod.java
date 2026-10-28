package com.syswind.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_methods")
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_mm", length = 150)
    private String nameMm;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "account_name", length = 150)
    private String accountName;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_image_id")
    private StoredImage qrImage;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logo_image_id")
    private StoredImage logoImage;

    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String instruction;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public PaymentMethod() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameMm() { return nameMm; }
    public void setNameMm(String nameMm) { this.nameMm = nameMm; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public StoredImage getQrImage() { return qrImage; }
    public void setQrImage(StoredImage qrImage) { this.qrImage = qrImage; }

    public StoredImage getLogoImage() { return logoImage; }
    public void setLogoImage(StoredImage logoImage) { this.logoImage = logoImage; }

    public String getQrCodeUrl() {
        if (qrImage != null) return "/api/images/" + qrImage.getId();
        return qrCodeUrl;
    }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }

    public String getLogoUrl() {
        if (logoImage != null) return "/api/images/" + logoImage.getId();
        return logoUrl;
    }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getInstruction() { return instruction; }
    public void setInstruction(String instruction) { this.instruction = instruction; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
