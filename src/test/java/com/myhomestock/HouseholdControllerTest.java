package com.myhomestock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myhomestock.domain.dto.HouseholdMemberRequestDto;
import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.domain.security.CustomOAuth2User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class HouseholdControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private HouseholdMemberRepository memberRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private OAuth2AuthenticationToken ownerAuthToken;
    private Long householdId;

    @BeforeEach
    void setUp() {
        memberRepository.deleteAll();
        householdRepository.deleteAll();
        userRepository.deleteAll();

        User owner = userRepository.save(new User("sub-owner", "owner@example.com", "オーナー", null));
        Household household = householdRepository.save(new Household("テスト世帯", owner.getId()));
        householdId = household.getId();

        memberRepository.save(new HouseholdMember(householdId, owner.getId(), "owner@example.com", "OWNER", OffsetDateTime.now()));

        CustomOAuth2User principal = new CustomOAuth2User(
                owner,
                household,
                "OWNER",
                Map.of("sub", "sub-owner", "email", "owner@example.com")
        );
        ownerAuthToken = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    @Test
    @DisplayName("GET /api/v1/households/members without auth should return 401")
    void testGetMembersUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/households/members"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/households/members with auth should return member list")
    void testGetMembersAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/households/members").with(authentication(ownerAuthToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("owner@example.com"))
                .andExpect(jsonPath("$[0].role").value("OWNER"));
    }

    @Test
    @DisplayName("POST /api/v1/households/members should invite new member")
    void testInviteMember() throws Exception {
        HouseholdMemberRequestDto request = new HouseholdMemberRequestDto("invited@example.com", "MEMBER");

        mockMvc.perform(post("/api/v1/households/members")
                        .with(authentication(ownerAuthToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("invited@example.com"))
                .andExpect(jsonPath("$.role").value("MEMBER"))
                .andExpect(jsonPath("$.status").value("INVITED"));
    }
}
