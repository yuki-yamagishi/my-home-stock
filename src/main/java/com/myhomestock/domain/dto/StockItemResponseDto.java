package com.myhomestock.domain.dto;

import com.myhomestock.domain.entity.StockItem;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Schema(description = "在庫アイテムレスポンス")
public class StockItemResponseDto {

    @Schema(description = "在庫ID", example = "1")
    private Long id;

    @Schema(description = "世帯ID（家族共有識別子）", example = "default")
    private String householdId;

    @Schema(description = "品名", example = "牛乳")
    private String name;

    @Schema(description = "カテゴリ", example = "冷蔵食品")
    private String category;

    @Schema(description = "現在数量", example = "2")
    private Integer quantity;

    @Schema(description = "単位", example = "本")
    private String unit;

    @Schema(description = "下限閾値", example = "1")
    private Integer minThreshold;

    @Schema(description = "メモ")
    private String memo;

    @Schema(description = "賞味・消費期限", example = "2026-09-30")
    private LocalDate expiryDate;

    @Schema(description = "楽観排他制御バージョン番号", example = "0")
    private Long version;

    @Schema(description = "作成日時")
    private OffsetDateTime createdAt;

    @Schema(description = "更新日時")
    private OffsetDateTime updatedAt;

    public StockItemResponseDto() {
    }

    public StockItemResponseDto(Long id, String householdId, String name, String category, Integer quantity, String unit,
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

    public static Builder builder() {
        return new Builder();
    }

    public static StockItemResponseDto fromEntity(StockItem entity) {
        return StockItemResponseDto.builder()
                .id(entity.getId())
                .householdId(entity.getHouseholdId())
                .name(entity.getName())
                .category(entity.getCategory())
                .quantity(entity.getQuantity())
                .unit(entity.getUnit())
                .minThreshold(entity.getMinThreshold())
                .memo(entity.getMemo())
                .expiryDate(entity.getExpiryDate())
                .version(entity.getVersion())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
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

        public StockItemResponseDto build() {
            return new StockItemResponseDto(id, householdId, name, category, quantity, unit, minThreshold, memo, expiryDate, version, createdAt, updatedAt);
        }
    }
}
