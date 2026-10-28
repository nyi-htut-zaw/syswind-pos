package com.syswind.dto;

import java.math.BigDecimal;

public class CustomerDto {
    private String id;
    private String organizationId;
    private String organizationName;
    private String name;
    private String fullName;
    private String phone;
    private String alternatePhone;
    private String email;
    private String address;
    private String city;
    private String stateDivision;
    private String township;
    private String townshipName;
    private String customerTier;
    private String loyaltyTier;
    private Integer totalOrders;
    private BigDecimal totalSpent;
    private String notes;
    private String createdAt;

    public CustomerDto() {}

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
        this.fullName = name;
    }

    public String getFullName() {
        return fullName != null ? fullName : name;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
        if (this.name == null) this.name = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStateDivision() {
        return stateDivision;
    }

    public void setStateDivision(String stateDivision) {
        this.stateDivision = stateDivision;
    }

    public String getTownship() {
        return township;
    }

    public void setTownship(String township) {
        this.township = township;
        this.townshipName = township;
    }

    public String getTownshipName() {
        return townshipName != null ? townshipName : township;
    }

    public void setTownshipName(String townshipName) {
        this.townshipName = townshipName;
        if (this.township == null) this.township = townshipName;
    }

    public String getCustomerTier() {
        return customerTier;
    }

    public void setCustomerTier(String customerTier) {
        this.customerTier = customerTier;
        this.loyaltyTier = customerTier;
    }

    public String getLoyaltyTier() {
        return loyaltyTier != null ? loyaltyTier : customerTier;
    }

    public void setLoyaltyTier(String loyaltyTier) {
        this.loyaltyTier = loyaltyTier;
        if (this.customerTier == null) this.customerTier = loyaltyTier;
    }

    public Integer getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Integer totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
