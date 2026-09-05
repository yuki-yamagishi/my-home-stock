package com.myhomestock.controller;

import com.myhomestock.domain.dto.StockItemRequestDto;
import com.myhomestock.domain.dto.StockItemResponseDto;
import com.myhomestock.service.StockItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    @Operation(summary = "在庫アイテム一覧取得", description = "登録されている在庫一覧を取得します。カテゴリによる絞り込みや世帯指定が可能です。")
    public ResponseEntity<List<StockItemResponseDto>> getStocks(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @Parameter(description = "絞り込みカテゴリ名（任意）")
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(service.getAllStockItems(householdId, category));
    }

    @GetMapping("/shopping-list")
    @Operation(summary = "買い物リスト取得", description = "現在数量が最小閾値以下の在庫アイテム（補充が必要な品目）を取得します。")
    public ResponseEntity<List<StockItemResponseDto>> getShoppingList(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId) {
        return ResponseEntity.ok(service.getShoppingList(householdId));
    }

    @GetMapping("/expiring")
    @Operation(summary = "期限切れ・間近アイテム取得", description = "指定日数以内に賞味・消費期限を迎える在庫を取得します。")
    public ResponseEntity<List<StockItemResponseDto>> getExpiringItems(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @Parameter(description = "日数範囲 (デフォルト: 7日以内)")
            @RequestParam(defaultValue = "7") int daysAhead) {
        return ResponseEntity.ok(service.getExpiringItems(householdId, daysAhead));
    }

    @GetMapping("/{id}")
    @Operation(summary = "在庫アイテム詳細取得", description = "指定IDの在庫アイテム詳細情報を取得します。")
    public ResponseEntity<StockItemResponseDto> getStockById(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getStockItemById(id, householdId));
    }

    @PostMapping
    @Operation(summary = "在庫アイテム新規登録", description = "新しい在庫アイテムを登録します。")
    public ResponseEntity<StockItemResponseDto> createStock(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @Valid @RequestBody StockItemRequestDto dto) {
        StockItemResponseDto created = service.createStockItem(dto, householdId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "在庫アイテム更新（楽観的排他制御）", description = "在庫情報を更新します。複数端末競合を防ぐため request body に最新 version を含めてください。")
    public ResponseEntity<StockItemResponseDto> updateStock(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @PathVariable Long id,
            @Valid @RequestBody StockItemRequestDto dto) {
        return ResponseEntity.ok(service.updateStockItem(id, dto, householdId));
    }

    @PostMapping("/{id}/consume")
    @Operation(summary = "在庫消費（数量減算）", description = "在庫を指定数量だけ消費します。")
    public ResponseEntity<StockItemResponseDto> consumeStock(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @PathVariable Long id,
            @Parameter(description = "消費数量 (デフォルト: 1)")
            @RequestParam(defaultValue = "1") int amount) {
        return ResponseEntity.ok(service.consumeStockItem(id, amount, householdId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "在庫アイテム削除", description = "指定IDの在庫アイテムを削除します。")
    public ResponseEntity<Void> deleteStock(
            @Parameter(description = "世帯ID（未指定時は default）")
            @RequestHeader(value = "X-Household-Id", required = false, defaultValue = "default") String householdId,
            @PathVariable Long id) {
        service.deleteStockItem(id, householdId);
        return ResponseEntity.noContent().build();
    }
}
