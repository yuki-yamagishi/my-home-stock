package com.myhomestock.controller;

import com.myhomestock.domain.dto.StockItemRequestDto;
import com.myhomestock.domain.dto.StockItemResponseDto;
import com.myhomestock.domain.security.CustomOAuth2User;
import com.myhomestock.service.StockItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stocks")
@Tag(name = "Stock Items", description = "自宅在庫アイテム管理・買い物リスト連携 API (家族共有・世帯別マルチテナント対応)")
public class StockItemController {

    private final StockItemService service;

    public StockItemController(StockItemService service) {
        this.service = service;
    }

    private String resolveHouseholdId(CustomOAuth2User user) {
        if (user != null && user.getHouseholdId() != null) {
            return String.valueOf(user.getHouseholdId());
        }
        return "default";
    }

    @GetMapping
    @Operation(summary = "在庫アイテム一覧取得", description = "登録されている在庫一覧を取得します。カテゴリによる絞り込みが可能です。")
    public ResponseEntity<List<StockItemResponseDto>> getStocks(
            @AuthenticationPrincipal CustomOAuth2User user,
            @Parameter(description = "絞り込みカテゴリ名（任意）")
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(service.getAllStockItems(resolveHouseholdId(user), category));
    }

    @GetMapping("/shopping-list")
    @Operation(summary = "買い物リスト取得", description = "現在数量が最小閾値以下の在庫アイテム（補充が必要な品目）を取得します。")
    public ResponseEntity<List<StockItemResponseDto>> getShoppingList(
            @AuthenticationPrincipal CustomOAuth2User user) {
        return ResponseEntity.ok(service.getShoppingList(resolveHouseholdId(user)));
    }

    @GetMapping("/expiring")
    @Operation(summary = "期限切れ・間近アイテム取得", description = "指定日数以内に賞味・消費期限を迎える在庫を取得します。")
    public ResponseEntity<List<StockItemResponseDto>> getExpiringItems(
            @AuthenticationPrincipal CustomOAuth2User user,
            @Parameter(description = "日数範囲 (デフォルト: 7日以内)")
            @RequestParam(defaultValue = "7") int daysAhead) {
        return ResponseEntity.ok(service.getExpiringItems(resolveHouseholdId(user), daysAhead));
    }

    @GetMapping("/{id}")
    @Operation(summary = "在庫アイテム詳細取得", description = "指定IDの在庫アイテム詳細情報を取得します。")
    public ResponseEntity<StockItemResponseDto> getStockById(
            @AuthenticationPrincipal CustomOAuth2User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getStockItemById(id, resolveHouseholdId(user)));
    }

    @PostMapping
    @Operation(summary = "在庫アイテム新規登録", description = "新しい在庫アイテムを登録します。所属世帯に自動紐付けされます。")
    public ResponseEntity<StockItemResponseDto> createStock(
            @AuthenticationPrincipal CustomOAuth2User user,
            @Valid @RequestBody StockItemRequestDto dto) {
        StockItemResponseDto created = service.createStockItem(dto, resolveHouseholdId(user));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "在庫アイテム更新（楽観的排他制御）", description = "在庫情報を更新します。複数端末競合を防ぐため request body に最新 version を含めてください。")
    public ResponseEntity<StockItemResponseDto> updateStock(
            @AuthenticationPrincipal CustomOAuth2User user,
            @PathVariable Long id,
            @Valid @RequestBody StockItemRequestDto dto) {
        return ResponseEntity.ok(service.updateStockItem(id, dto, resolveHouseholdId(user)));
    }

    @PostMapping("/{id}/consume")
    @Operation(summary = "在庫消費（数量減算）", description = "在庫を指定数量だけ消費します。")
    public ResponseEntity<StockItemResponseDto> consumeStock(
            @AuthenticationPrincipal CustomOAuth2User user,
            @PathVariable Long id,
            @Parameter(description = "消費数量 (デフォルト: 1)")
            @RequestParam(defaultValue = "1") int amount) {
        return ResponseEntity.ok(service.consumeStockItem(id, amount, resolveHouseholdId(user)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "在庫アイテム削除", description = "指定IDの在庫アイテムを削除します。")
    public ResponseEntity<Void> deleteStock(
            @AuthenticationPrincipal CustomOAuth2User user,
            @PathVariable Long id) {
        service.deleteStockItem(id, resolveHouseholdId(user));
        return ResponseEntity.noContent().build();
    }
}
