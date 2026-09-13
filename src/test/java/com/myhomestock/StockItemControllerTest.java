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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.User;
import com.myhomestock.domain.security.CustomOAuth2User;
import java.util.Map;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
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
    @DisplayName("GET /api/v1/stocks without authentication should return 401 Unauthorized")
    void testUnauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/stocks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
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
    @DisplayName("GET /api/v1/stocks should return items only for user's household (server-driven isolation)")
    void testGetStocksByHousehold() throws Exception {
        repository.save(StockItem.builder().householdId("100").name("世帯100のパン").category("主食").quantity(2).minThreshold(1).build());
        repository.save(StockItem.builder().householdId("200").name("世帯200の米").category("主食").quantity(5).minThreshold(2).build());

        User user = new User("sub-100", "u100@example.com", "ユーザー100", null);
        user.setId(100L);
        Household household = new Household("世帯100", 100L);
        household.setId(100L);
        CustomOAuth2User principal = new CustomOAuth2User(user, household, "MEMBER", Map.of("sub", "sub-100"));
        var authToken = new org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken(
                principal, principal.getAuthorities(), "google");

        mockMvc.perform(get("/api/v1/stocks").with(authentication(authToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("世帯100のパン"))
                .andExpect(jsonPath("$[0].householdId").value("100"));
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/v1/stocks/{id}/consume should decrement stock quantity")
    void testConsumeStock() throws Exception {
        StockItem saved = repository.save(StockItem.builder().householdId("default").name("ティッシュ").category("日用品").quantity(5).minThreshold(2).build());

        mockMvc.perform(post("/api/v1/stocks/" + saved.getId() + "/consume?amount=2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    @WithMockUser
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
