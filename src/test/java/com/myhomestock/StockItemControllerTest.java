package com.myhomestock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.myhomestock.domain.dto.StockItemRequestDto;
import com.myhomestock.domain.entity.StockItem;
import com.myhomestock.repository.StockItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class StockItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StockItemRepository repository;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/stocks should create new stock item and default household to 'default'")
    void testCreateStockItem() throws Exception {
        StockItemRequestDto request = StockItemRequestDto.builder()
                .name("卵")
                .category("冷蔵食品")
                .quantity(10)
                .unit("個")
                .minThreshold(4)
                .build();

        mockMvc.perform(post("/api/v1/stocks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("卵"))
                .andExpect(jsonPath("$.householdId").value("default"))
                .andExpect(jsonPath("$.version").value(0));
    }

    @Test
    @DisplayName("GET /api/v1/stocks should filter by X-Household-Id header")
    void testGetStocksByHousehold() throws Exception {
        repository.save(StockItem.builder().householdId("house-A").name("パン").category("主食").quantity(2).minThreshold(1).build());
        repository.save(StockItem.builder().householdId("house-B").name("米").category("主食").quantity(5).minThreshold(2).build());

        mockMvc.perform(get("/api/v1/stocks")
                        .header("X-Household-Id", "house-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("パン"));
    }

    @Test
    @DisplayName("POST /api/v1/stocks/{id}/consume should decrement stock quantity")
    void testConsumeStock() throws Exception {
        StockItem saved = repository.save(StockItem.builder().householdId("default").name("ティッシュ").category("日用品").quantity(5).minThreshold(2).build());

        mockMvc.perform(post("/api/v1/stocks/" + saved.getId() + "/consume?amount=2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    @DisplayName("PUT /api/v1/stocks/{id} with outdated version should throw 409 Conflict (Optimistic Lock)")
    void testOptimisticLockConflict() throws Exception {
        StockItem saved = repository.save(StockItem.builder().householdId("default").name("シャンプー").category("日用品").quantity(2).minThreshold(1).build());

        StockItemRequestDto conflictingRequest = StockItemRequestDto.builder()
                .name("シャンプー更新")
                .quantity(3)
                .minThreshold(1)
                .version(999L) // Wrong version
                .build();

        mockMvc.perform(put("/api/v1/stocks/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflictingRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("OPTIMISTIC_LOCK_CONFLICT"));
    }
}
