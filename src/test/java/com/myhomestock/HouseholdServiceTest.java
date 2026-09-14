package com.myhomestock;

import com.myhomestock.domain.dto.HouseholdMemberRequestDto;
import com.myhomestock.domain.dto.HouseholdMemberResponseDto;
import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import com.myhomestock.service.HouseholdService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class HouseholdServiceTest {

    @Autowired
    private HouseholdService householdService;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private HouseholdMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    private Long ownerUserId;
    private Long memberUserId;
    private Long householdId;

    @BeforeEach
    void setUp() {
        memberRepository.deleteAll();
        householdRepository.deleteAll();
        userRepository.deleteAll();

        User owner = userRepository.save(new User("sub-1", "owner@example.com", "オーナー", null));
        ownerUserId = owner.getId();

        User normalMember = userRepository.save(new User("sub-2", "member@example.com", "一般メンバー", null));
        memberUserId = normalMember.getId();

        Household household = householdRepository.save(new Household("テスト世帯", ownerUserId));
        householdId = household.getId();

        memberRepository.save(new HouseholdMember(householdId, ownerUserId, "owner@example.com", "OWNER", OffsetDateTime.now()));
        memberRepository.save(new HouseholdMember(householdId, memberUserId, "member@example.com", "MEMBER", OffsetDateTime.now()));
    }

    @Test
    @DisplayName("getHouseholdMembers should return all members for household")
    void testGetHouseholdMembers() {
        List<HouseholdMemberResponseDto> members = householdService.getHouseholdMembers(householdId);
        assertThat(members).hasSize(2);
    }

    @Test
    @DisplayName("inviteMember by OWNER should succeed")
    void testInviteMemberByOwner() {
        HouseholdMemberRequestDto request = new HouseholdMemberRequestDto("newfamily@example.com", "MEMBER");
        HouseholdMemberResponseDto response = householdService.inviteMember(householdId, ownerUserId, request);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("newfamily@example.com");
        assertThat(response.status()).isEqualTo("INVITED");
    }

    @Test
    @DisplayName("inviteMember by non-OWNER (MEMBER) should throw AccessDeniedException")
    void testInviteMemberByNonOwnerThrows() {
        HouseholdMemberRequestDto request = new HouseholdMemberRequestDto("another@example.com", "MEMBER");

        assertThatThrownBy(() -> householdService.inviteMember(householdId, memberUserId, request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("inviteMember with duplicate email should throw IllegalArgumentException")
    void testInviteDuplicateEmailThrows() {
        HouseholdMemberRequestDto request = new HouseholdMemberRequestDto("member@example.com", "MEMBER");

        assertThatThrownBy(() -> householdService.inviteMember(householdId, ownerUserId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("既に世帯に登録または招待されています");
    }
}
