package com.myhomestock;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.User;
import com.myhomestock.domain.security.CustomOAuth2User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/auth/me without auth should return 401 Unauthorized")
    void testGetMeUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/auth/me with CustomOAuth2User should return user and household info")
    void testGetMeAuthenticated() throws Exception {
        User user = new User("sub-12345", "test@gmail.com", "テスト太郎", "https://example.com/pic.jpg");
        user.setId(10L);
        Household household = new Household("テスト太郎の世帯", 10L);
        household.setId(20L);

        CustomOAuth2User oAuth2User = new CustomOAuth2User(
                user,
                household,
                "OWNER",
                Map.of("sub", "sub-12345", "email", "test@gmail.com", "name", "テスト太郎")
        );

        OAuth2AuthenticationToken authToken = new OAuth2AuthenticationToken(
                oAuth2User,
                oAuth2User.getAuthorities(),
                "google"
        );

        mockMvc.perform(get("/api/v1/auth/me").with(authentication(authToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.email").value("test@gmail.com"))
                .andExpect(jsonPath("$.displayName").value("テスト太郎"))
                .andExpect(jsonPath("$.householdId").value(20))
                .andExpect(jsonPath("$.householdName").value("テスト太郎の世帯"))
                .andExpect(jsonPath("$.role").value("OWNER"));
    }
}
