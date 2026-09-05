package com.myhomestock.domain.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "stock_items")
public class StockItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Household Identifier for family sharing and multi-device data isolation.
     * Defaults to 'default' for single-household usage.
     */
    @Column(name = "household_id", nullable = false, length = 50)
    private String householdId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "min_threshold", nullable = false)
    private Integer minThreshold;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    /**
     * Optimistic Locking version column.
     * Prevents concurrent update overwrites across multiple mobile/web clients.
     */
    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public StockItem() {
    }

    public StockItem(Long id, String householdId, String name, String category, Integer quantity, String unit,
                     Integer minThreshold, String memo, LocalDate expiryDate, Long version,
                     OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.householdId = householdId;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minThreshold = minThreshold;
        this.memo = memo;
        this.expiryDate = expiryDate;
        this.version = version;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.householdId == null || this.householdId.isBlank()) {
            this.householdId = "default";
        }
        if (this.version == null) {
            this.version = 0L;
        }
        if (this.category == null) {
            this.category = "未分類";
        }
        if (this.unit == null) {
            this.unit = "個";
        }
        if (this.quantity == null) {
            this.quantity = 1;
        }
        if (this.minThreshold == null) {
            this.minThreshold = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getHouseholdId() { return householdId; }
    public void setHouseholdId(String householdId) { this.householdId = householdId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getMinThreshold() { return minThreshold; }
    public void setMinThreshold(Integer minThreshold) { this.minThreshold = minThreshold; }

    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private Long id;
        private String householdId;
        private String name;
        private String category;
        private Integer quantity;
        private String unit;
        private Integer minThreshold;
        private String memo;
        private LocalDate expiryDate;
        private Long version;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder householdId(String householdId) { this.householdId = householdId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder minThreshold(Integer minThreshold) { this.minThreshold = minThreshold; return this; }
        public Builder memo(String memo) { this.memo = memo; return this; }
        public Builder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public Builder version(Long version) { this.version = version; return this; }
        public Builder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public StockItem build() {
            return new StockItem(id, householdId, name, category, quantity, unit, minThreshold, memo, expiryDate, version, createdAt, updatedAt);
        }
    }
}
