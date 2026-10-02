package com.myhomestock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myhomestock.domain.dto.StockItemRequestDto;
import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.User;
import com.myhomestock.domain.security.CustomOAuth2User;
import com.myhomestock.repository.StockItemRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
public class SecurityCsrfCorsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StockItemRepository stockItemRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private OAuth2AuthenticationToken authToken;

    @BeforeEach
    void setUp() {
        stockItemRepository.deleteAll();

        User user = new User("sub-csrf-test", "csrf-test@example.com", "CSRFテストユーザー", null);
        user.setId(500L);
        Household household = new Household("CSRF世帯", 500L);
        household.setId(500L);

        CustomOAuth2User principal = new CustomOAuth2User(
                user,
                household,
                "OWNER",
                Map.of("sub", "sub-csrf-test", "email", "csrf-test@example.com")
        );
        authToken = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    @Test
    @DisplayName("CORS: Request from unapproved origin (e.g. attacker.duckdns.org) should not receive allow-origin header")
    void testCorsDisallowedOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/stocks")
                        .header("Origin", "https://attacker.duckdns.org")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CORS: Request from allowed origin (localhost) should receive Access-Control-Allow-Origin and Credentials")
    void testCorsAllowedOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/stocks")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CSRF: Mutating request without CSRF token should return 403 Forbidden")
    void testMutatingRequestWithoutCsrfTokenReturns403() throws Exception {
        StockItemRequestDto request = StockItemRequestDto.builder()
                .name("テスト品目")
                .category("日用品")
                .quantity(1)
                .minThreshold(1)
                .build();

        mockMvc.perform(post("/api/v1/stocks")
                        .with(authentication(authToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CSRF: Mutating request with invalid CSRF token should return 403 Forbidden")
    void testMutatingRequestWithInvalidCsrfTokenReturns403() throws Exception {
        StockItemRequestDto request = StockItemRequestDto.builder()
                .name("テスト品目")
                .category("日用品")
                .quantity(1)
                .minThreshold(1)
                .build();

        mockMvc.perform(post("/api/v1/stocks")
                        .with(authentication(authToken))
                        .header("X-XSRF-TOKEN", "invalid-csrf-token-12345")
                        .cookie(new Cookie("XSRF-TOKEN", "real-csrf-token-67890"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CSRF: Mutating request with valid XSRF-TOKEN cookie and header should succeed")
    void testMutatingRequestWithValidCsrfTokenSucceeds() throws Exception {
        // Step 1: Initial GET request to obtain XSRF-TOKEN cookie via CsrfCookieFilter
        MvcResult getResult = mockMvc.perform(get("/api/v1/auth/me")
                        .with(authentication(authToken)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie xsrfCookie = getResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(xsrfCookie, "XSRF-TOKEN cookie should be set by backend");
        String tokenValue = xsrfCookie.getValue();
        assertNotNull(tokenValue, "XSRF-TOKEN value should not be null");

        // Step 2: Use the cookie and matching header on mutating request
        StockItemRequestDto request = StockItemRequestDto.builder()
                .name("テスト品目")
                .category("日用品")
                .quantity(3)
                .minThreshold(1)
                .build();

        mockMvc.perform(post("/api/v1/stocks")
                        .with(authentication(authToken))
                        .cookie(xsrfCookie)
                        .header("X-XSRF-TOKEN", tokenValue)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
