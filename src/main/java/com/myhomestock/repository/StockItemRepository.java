package com.myhomestock.repository;

import com.myhomestock.domain.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, Long> {

    // Household-scoped queries (family sharing isolation)
    List<StockItem> findAllByHouseholdIdOrderByCategoryAscNameAsc(String householdId);

    List<StockItem> findByHouseholdIdAndCategoryOrderByNameAsc(String householdId, String category);

    @Query("SELECT s FROM StockItem s WHERE s.householdId = :householdId AND s.quantity <= s.minThreshold ORDER BY s.category ASC, s.name ASC")
    List<StockItem> findShortageItemsByHousehold(@Param("householdId") String householdId);

    List<StockItem> findByHouseholdIdAndExpiryDateLessThanEqualOrderByExpiryDateAsc(String householdId, LocalDate expiryDate);

    Optional<StockItem> findByIdAndHouseholdId(Long id, String householdId);

    // Global queries (backward compatibility / single-household default)
    List<StockItem> findAllByOrderByCategoryAscNameAsc();

    List<StockItem> findByCategoryOrderByNameAsc(String category);

    @Query("SELECT s FROM StockItem s WHERE s.quantity <= s.minThreshold ORDER BY s.category ASC, s.name ASC")
    List<StockItem> findShortageItems();

    List<StockItem> findByExpiryDateLessThanEqualOrderByExpiryDateAsc(LocalDate expiryDate);
}
