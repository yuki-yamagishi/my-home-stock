package com.myhomestock;

import com.myhomestock.domain.dto.StockItemRequestDto;
import com.myhomestock.domain.dto.StockItemResponseDto;
import com.myhomestock.domain.entity.RemainingLevel;
import com.myhomestock.domain.entity.StockType;
import com.myhomestock.repository.StockItemRepository;
import com.myhomestock.service.StockItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class StockItemServiceTest {

    @Autowired
    private StockItemService service;

    @Autowired
    private StockItemRepository repository;

    private static final String TEST_HOUSEHOLD = "test-household";

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("createStockItem: REMAINING_LEVEL with null level should default to FULL")
    void testCreateRemainingLevelDefaultFull() {
        StockItemRequestDto dto = StockItemRequestDto.builder()
                .name("砂糖")
                .category("調味料")
                .unit("袋")
                .stockType(StockType.REMAINING_LEVEL)
                .build();

        StockItemResponseDto created = service.createStockItem(dto, TEST_HOUSEHOLD);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getStockType()).isEqualTo(StockType.REMAINING_LEVEL);
        assertThat(created.getRemainingLevel()).isEqualTo(RemainingLevel.FULL);
        assertThat(created.getQuantity()).isEqualTo(3);
    }

    @Test
    @DisplayName("consumeStockItem: REMAINING_LEVEL should decrease level sequentially (FULL -> PLENTY -> LOW -> EMPTY)")
    void testConsumeRemainingLevel() {
        StockItemRequestDto dto = StockItemRequestDto.builder()
                .name("マヨネーズ")
                .category("調味料")
                .unit("本")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.FULL)
                .build();

        StockItemResponseDto created = service.createStockItem(dto, TEST_HOUSEHOLD);
        Long id = created.getId();

        // 1回目消費: FULL -> PLENTY
        StockItemResponseDto c1 = service.consumeStockItem(id, 1, TEST_HOUSEHOLD);
        assertThat(c1.getRemainingLevel()).isEqualTo(RemainingLevel.PLENTY);
        assertThat(c1.getQuantity()).isEqualTo(2);

        // 2回目消費: PLENTY -> LOW
        StockItemResponseDto c2 = service.consumeStockItem(id, 1, TEST_HOUSEHOLD);
        assertThat(c2.getRemainingLevel()).isEqualTo(RemainingLevel.LOW);
        assertThat(c2.getQuantity()).isEqualTo(1);

        // 3回目消費: LOW -> EMPTY
        StockItemResponseDto c3 = service.consumeStockItem(id, 1, TEST_HOUSEHOLD);
        assertThat(c3.getRemainingLevel()).isEqualTo(RemainingLevel.EMPTY);
        assertThat(c3.getQuantity()).isEqualTo(0);

        // 4回目消費: EMPTY のまま
        StockItemResponseDto c4 = service.consumeStockItem(id, 1, TEST_HOUSEHOLD);
        assertThat(c4.getRemainingLevel()).isEqualTo(RemainingLevel.EMPTY);
        assertThat(c4.getQuantity()).isEqualTo(0);
    }

    @Test
    @DisplayName("updateStockItem: should update remainingLevel directly and sync quantity")
    void testUpdateRemainingLevel() {
        StockItemRequestDto createDto = StockItemRequestDto.builder()
                .name("洗剤")
                .category("日用品・消耗品")
                .unit("本")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.FULL)
                .build();

        StockItemResponseDto created = service.createStockItem(createDto, TEST_HOUSEHOLD);

        StockItemRequestDto updateDto = StockItemRequestDto.builder()
                .name("洗剤")
                .category("日用品・消耗品")
                .unit("本")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.LOW)
                .version(created.getVersion())
                .build();

        StockItemResponseDto updated = service.updateStockItem(created.getId(), updateDto, TEST_HOUSEHOLD);
        assertThat(updated.getRemainingLevel()).isEqualTo(RemainingLevel.LOW);
        assertThat(updated.getQuantity()).isEqualTo(1);
    }

    @Test
    @DisplayName("getShoppingList: should include REMAINING_LEVEL items that are LOW or EMPTY")
    void testShoppingListIncludesRemainingLevelShortages() {
        // FULL (対象外)
        service.createStockItem(StockItemRequestDto.builder()
                .name("米")
                .category("主食")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.FULL)
                .build(), TEST_HOUSEHOLD);

        // PLENTY (対象外)
        service.createStockItem(StockItemRequestDto.builder()
                .name("塩")
                .category("調味料")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.PLENTY)
                .build(), TEST_HOUSEHOLD);

        // LOW (対象)
        service.createStockItem(StockItemRequestDto.builder()
                .name("醤油")
                .category("調味料")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.LOW)
                .build(), TEST_HOUSEHOLD);

        // EMPTY (対象)
        service.createStockItem(StockItemRequestDto.builder()
                .name("みりん")
                .category("調味料")
                .stockType(StockType.REMAINING_LEVEL)
                .remainingLevel(RemainingLevel.EMPTY)
                .build(), TEST_HOUSEHOLD);

        List<StockItemResponseDto> shoppingList = service.getShoppingList(TEST_HOUSEHOLD);
        assertThat(shoppingList).extracting(StockItemResponseDto::getName).containsExactlyInAnyOrder("醤油", "みりん");
    }
}
