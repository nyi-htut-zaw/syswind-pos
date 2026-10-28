package com.syswind.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "categories")
public class Category {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private StoredImage image;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Category() {}

    public Category(String name, String nameMm, Organization org) {
        this.name = name;
        this.nameMm = nameMm;
        this.organization = org;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameMm() { return nameMm; }
    public void setNameMm(String nameMm) { this.nameMm = nameMm; }

    public Category getParent() { return parent; }
    public void setParent(Category parent) { this.parent = parent; }

    public StoredImage getImage() { return image; }
    public void setImage(StoredImage image) { this.image = image; }

    public String getImageUrl() {
        if (image != null) return "/api/images/" + image.getId();
        return imageUrl;
    }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
