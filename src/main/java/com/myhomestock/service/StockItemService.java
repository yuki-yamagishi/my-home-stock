package com.myhomestock.service;

import com.myhomestock.domain.dto.StockItemRequestDto;
import com.myhomestock.domain.dto.StockItemResponseDto;
import com.myhomestock.domain.entity.StockItem;
import com.myhomestock.repository.StockItemRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StockItemService {

    private static final Logger log = LoggerFactory.getLogger(StockItemService.class);
    private static final String DEFAULT_HOUSEHOLD_ID = "default";

    private final StockItemRepository repository;

    public StockItemService(StockItemRepository repository) {
        this.repository = repository;
    }

    private String resolveHouseholdId(String householdId) {
        return (householdId != null && !householdId.isBlank()) ? householdId.trim() : DEFAULT_HOUSEHOLD_ID;
    }

    public List<StockItemResponseDto> getAllStockItems(String householdId, String category) {
        String hid = resolveHouseholdId(householdId);
        List<StockItem> items = (category != null && !category.isBlank())
                ? repository.findByHouseholdIdAndCategoryOrderByNameAsc(hid, category.trim())
                : repository.findAllByHouseholdIdOrderByCategoryAscNameAsc(hid);
        return items.stream().map(StockItemResponseDto::fromEntity).collect(Collectors.toList());
    }

    public List<StockItemResponseDto> getAllStockItems(String category) {
        return getAllStockItems(DEFAULT_HOUSEHOLD_ID, category);
    }

    public List<StockItemResponseDto> getShoppingList(String householdId) {
        String hid = resolveHouseholdId(householdId);
        return repository.findShortageItemsByHousehold(hid).stream()
                .map(StockItemResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<StockItemResponseDto> getShoppingList() {
        return getShoppingList(DEFAULT_HOUSEHOLD_ID);
    }

    public List<StockItemResponseDto> getExpiringItems(String householdId, int daysAhead) {
        String hid = resolveHouseholdId(householdId);
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        return repository.findByHouseholdIdAndExpiryDateLessThanEqualOrderByExpiryDateAsc(hid, threshold).stream()
                .map(StockItemResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<StockItemResponseDto> getExpiringItems(int daysAhead) {
        return getExpiringItems(DEFAULT_HOUSEHOLD_ID, daysAhead);
    }

    public StockItemResponseDto getStockItemById(Long id, String householdId) {
        String hid = resolveHouseholdId(householdId);
        StockItem item = repository.findByIdAndHouseholdId(id, hid)
                .orElseThrow(() -> new EntityNotFoundException("在庫アイテムが見つかりません: ID " + id + ", 世帯 " + hid));
        return StockItemResponseDto.fromEntity(item);
    }

    public StockItemResponseDto getStockItemById(Long id) {
        return getStockItemById(id, DEFAULT_HOUSEHOLD_ID);
    }

    @Transactional
    public StockItemResponseDto createStockItem(StockItemRequestDto dto, String householdId) {
        String hid = resolveHouseholdId(dto.getHouseholdId() != null ? dto.getHouseholdId() : householdId);

        StockItem entity = StockItem.builder()
                .householdId(hid)
                .name(dto.getName())
                .category(dto.getCategory() != null ? dto.getCategory() : "未分類")
                .quantity(dto.getQuantity())
                .unit(dto.getUnit() != null ? dto.getUnit() : "個")
                .minThreshold(dto.getMinThreshold() != null ? dto.getMinThreshold() : 1)
                .memo(dto.getMemo())
                .expiryDate(dto.getExpiryDate())
                .build();

        StockItem saved = repository.save(entity);
        log.info("StockItem created: id={}, household={}, name={}", saved.getId(), saved.getHouseholdId(), saved.getName());
        return StockItemResponseDto.fromEntity(saved);
    }

    @Transactional
    public StockItemResponseDto createStockItem(StockItemRequestDto dto) {
        return createStockItem(dto, DEFAULT_HOUSEHOLD_ID);
    }

    @Transactional
    public StockItemResponseDto updateStockItem(Long id, StockItemRequestDto dto, String householdId) {
        String hid = resolveHouseholdId(householdId);
        StockItem item = repository.findByIdAndHouseholdId(id, hid)
                .orElseThrow(() -> new EntityNotFoundException("在庫アイテムが見つかりません: ID " + id + ", 世帯 " + hid));

        // Optimistic locking verification if client provided version
        if (dto.getVersion() != null && !dto.getVersion().equals(item.getVersion())) {
            throw new OptimisticLockingFailureException(
                    String.format("他端末によって既に更新されています (クライアントVersion: %d, DB Version: %d)",
                            dto.getVersion(), item.getVersion()));
        }

        item.setName(dto.getName());
        if (dto.getCategory() != null) item.setCategory(dto.getCategory());
        if (dto.getQuantity() != null) item.setQuantity(dto.getQuantity());
        if (dto.getUnit() != null) item.setUnit(dto.getUnit());
        if (dto.getMinThreshold() != null) item.setMinThreshold(dto.getMinThreshold());
        item.setMemo(dto.getMemo());
        item.setExpiryDate(dto.getExpiryDate());

        StockItem updated = repository.save(item);
        log.info("StockItem updated: id={}, household={}, newVersion={}", updated.getId(), updated.getHouseholdId(), updated.getVersion());
        return StockItemResponseDto.fromEntity(updated);
    }

    @Transactional
    public StockItemResponseDto updateStockItem(Long id, StockItemRequestDto dto) {
        return updateStockItem(id, dto, DEFAULT_HOUSEHOLD_ID);
    }

    @Transactional
    public StockItemResponseDto consumeStockItem(Long id, int amount, String householdId) {
        String hid = resolveHouseholdId(householdId);
        StockItem item = repository.findByIdAndHouseholdId(id, hid)
                .orElseThrow(() -> new EntityNotFoundException("在庫アイテムが見つかりません: ID " + id + ", 世帯 " + hid));

        int newQuantity = Math.max(0, item.getQuantity() - amount);
        item.setQuantity(newQuantity);
        StockItem updated = repository.save(item);
        log.info("StockItem consumed: id={}, household={}, amount={}, remainingQuantity={}", id, hid, amount, newQuantity);
        return StockItemResponseDto.fromEntity(updated);
    }

    @Transactional
    public StockItemResponseDto consumeStockItem(Long id, int amount) {
        return consumeStockItem(id, amount, DEFAULT_HOUSEHOLD_ID);
    }

    @Transactional
    public void deleteStockItem(Long id, String householdId) {
        String hid = resolveHouseholdId(householdId);
        StockItem item = repository.findByIdAndHouseholdId(id, hid)
                .orElseThrow(() -> new EntityNotFoundException("在庫アイテムが見つかりません: ID " + id + ", 世帯 " + hid));
        repository.delete(item);
        log.info("StockItem deleted: id={}, household={}", id, hid);
    }

    @Transactional
    public void deleteStockItem(Long id) {
        deleteStockItem(id, DEFAULT_HOUSEHOLD_ID);
    }
}
