package com.syswind.dto;

import java.math.BigDecimal;
import java.util.List;

public class ProductDto {
    private String id;
    private String organizationId;
    private String organizationName;
    private String name;
    private String nameMm;
    private String sku;
    private String barcode;
    private String description;
    private BigDecimal costPrice;
    private BigDecimal salePrice;
    private BigDecimal sellingPrice;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private String unit;
    private String imageUrl;
    private Boolean isActive;
    private String categoryId;
    private String categoryName;
    private String categoryNameMm;
    private List<?> variants;

    public ProductDto() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNameMm() {
        return nameMm;
    }

    public void setNameMm(String nameMm) {
        this.nameMm = nameMm;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(BigDecimal costPrice) {
        this.costPrice = costPrice;
    }

    public BigDecimal getSalePrice() {
        return salePrice;
    }

    public void setSalePrice(BigDecimal salePrice) {
        this.salePrice = salePrice;
        this.sellingPrice = salePrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice != null ? sellingPrice : salePrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
        if (this.salePrice == null) this.salePrice = sellingPrice;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategoryNameMm() {
        return categoryNameMm;
    }

    public void setCategoryNameMm(String categoryNameMm) {
        this.categoryNameMm = categoryNameMm;
    }

    public List<?> getVariants() {
        return variants;
    }

    public void setVariants(List<?> variants) {
        this.variants = variants;
    }
}
