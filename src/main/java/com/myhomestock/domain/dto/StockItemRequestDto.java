package com.myhomestock.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "在庫アイテム登録・更新リクエスト")
public class StockItemRequestDto {

    @NotBlank(message = "品名は必須です")
    @Size(max = 100, message = "品名は100文字以内で入力してください")
    @Schema(description = "品名", example = "牛乳")
    private String name;

    @Size(max = 50, message = "カテゴリは50文字以内で入力してください")
    @Schema(description = "カテゴリ", example = "冷蔵食品")
    private String category;

    @NotNull(message = "数量は必須です")
    @Min(value = 0, message = "数量は0以上である必要があります")
    @Schema(description = "現在数量", example = "2")
    private Integer quantity;

    @Size(max = 20, message = "単位は20文字以内で入力してください")
    @Schema(description = "単位", example = "本")
    private String unit;

    @NotNull(message = "発注基準値は必須です")
    @Min(value = 0, message = "発注基準値は0以上である必要があります")
    @Schema(description = "下限閾値（これを下回ると買い物リスト入り）", example = "1")
    private Integer minThreshold;

    @Schema(description = "メモ・購入店舗等", example = "低脂肪乳")
    private String memo;

    @Schema(description = "賞味・消費期限", example = "2026-09-30")
    private LocalDate expiryDate;

    @Schema(description = "楽観的排他制御用バージョン番号 (更新時は必須)", example = "0")
    private Long version;

    @Size(max = 50, message = "世帯IDは50文字以内で指定してください")
    @Schema(description = "世帯ID（家族共有グループ識別子・未指定時は default）", example = "default")
    private String householdId;

    public StockItemRequestDto() {
    }

    public StockItemRequestDto(String name, String category, Integer quantity, String unit,
                               Integer minThreshold, String memo, LocalDate expiryDate, Long version,
                               String householdId) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minThreshold = minThreshold;
        this.memo = memo;
        this.expiryDate = expiryDate;
        this.version = version;
        this.householdId = householdId;
    }

    public static Builder builder() {
        return new Builder();
    }

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

    public String getHouseholdId() { return householdId; }
    public void setHouseholdId(String householdId) { this.householdId = householdId; }

    public static class Builder {
        private String name;
        private String category;
        private Integer quantity;
        private String unit;
        private Integer minThreshold;
        private String memo;
        private LocalDate expiryDate;
        private Long version;
        private String householdId;

        public Builder name(String name) { this.name = name; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder minThreshold(Integer minThreshold) { this.minThreshold = minThreshold; return this; }
        public Builder memo(String memo) { this.memo = memo; return this; }
        public Builder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public Builder version(Long version) { this.version = version; return this; }
        public Builder householdId(String householdId) { this.householdId = householdId; return this; }

        public StockItemRequestDto build() {
            return new StockItemRequestDto(name, category, quantity, unit, minThreshold, memo, expiryDate, version, householdId);
        }
    }
}
