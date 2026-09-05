package com.myhomestock;

import com.myhomestock.domain.entity.StockItem;
import com.myhomestock.repository.StockItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class StockItemRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private StockItemRepository repository;

    @Test
    @DisplayName("StockItem should persist and increment version on update (Optimistic Locking)")
    void testOptimisticLockingVersionIncrement() {
        StockItem item = StockItem.builder()
                .name("納豆")
                .category("冷蔵食品")
                .quantity(3)
                .unit("パック")
                .minThreshold(2)
                .expiryDate(LocalDate.now().plusDays(5))
                .build();

        StockItem saved = repository.saveAndFlush(item);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getHouseholdId()).isEqualTo("default");
        assertThat(saved.getVersion()).isEqualTo(0L);

        // Update item
        saved.setQuantity(1);
        StockItem updated = repository.saveAndFlush(saved);
        entityManager.clear();

        StockItem reloaded = repository.findById(updated.getId()).orElseThrow();
        assertThat(reloaded.getQuantity()).isEqualTo(1);
        assertThat(reloaded.getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findShortageItems should return items where quantity <= minThreshold")
    void testFindShortageItems() {
        StockItem inStock = StockItem.builder()
                .name("醤油")
                .category("調味料")
                .quantity(2)
                .minThreshold(1)
                .build();
        StockItem shortItem = StockItem.builder()
                .name("みりん")
                .category("調味料")
                .quantity(0)
                .minThreshold(1)
                .build();

        repository.saveAndFlush(inStock);
        repository.saveAndFlush(shortItem);

        List<StockItem> shortages = repository.findShortageItems();
        assertThat(shortages).extracting(StockItem::getName).contains("みりん");
        assertThat(shortages).extracting(StockItem::getName).doesNotContain("醤油");
    }

    @Test
    @DisplayName("household isolation: queries should partition items by householdId")
    void testHouseholdIsolation() {
        StockItem familyA = StockItem.builder()
                .householdId("family-a")
                .name("牛乳 (家族A)")
                .category("冷蔵食品")
                .quantity(2)
                .minThreshold(1)
                .build();
        StockItem familyB = StockItem.builder()
                .householdId("family-b")
                .name("牛乳 (家族B)")
                .category("冷蔵食品")
                .quantity(1)
                .minThreshold(1)
                .build();

        repository.saveAndFlush(familyA);
        repository.saveAndFlush(familyB);

        List<StockItem> itemsA = repository.findAllByHouseholdIdOrderByCategoryAscNameAsc("family-a");
        assertThat(itemsA).extracting(StockItem::getName).contains("牛乳 (家族A)");
        assertThat(itemsA).extracting(StockItem::getName).doesNotContain("牛乳 (家族B)");

        List<StockItem> itemsB = repository.findAllByHouseholdIdOrderByCategoryAscNameAsc("family-b");
        assertThat(itemsB).extracting(StockItem::getName).contains("牛乳 (家族B)");
        assertThat(itemsB).extracting(StockItem::getName).doesNotContain("牛乳 (家族A)");
    }
}
