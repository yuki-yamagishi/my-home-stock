package com.myhomestock;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import com.myhomestock.service.UserHouseholdSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class UserHouseholdSyncServiceTest {

    @Autowired
    private UserHouseholdSyncService syncService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private HouseholdMemberRepository memberRepository;

    @BeforeEach
    void setUp() {
        memberRepository.deleteAll();
        householdRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("ホワイトリストに設定されたメールアドレスは正常に世帯作成・認証成功する")
    void syncUser_allowedEmail_success() {
        // application-test.yml で allowed-emails に yuki.yamagishi.contact@gmail.com が登録済
        String email = "yuki.yamagishi.contact@gmail.com";
        var result = syncService.syncUserAndHousehold("sub-123", email, "山岸", "https://pic.jpg");

        assertThat(result).isNotNull();
        assertThat(result.user().getEmail()).isEqualTo(email);
        assertThat(result.role()).isEqualTo("OWNER");
        assertThat(result.household().getName()).isEqualTo("山岸の世帯");
        assertThat(userRepository.count()).isEqualTo(1);
        assertThat(householdRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("ホワイトリスト外かつ未招待の第三者は門前払い（OAuth2AuthenticationException）となりDBに一切書き込まれない")
    void syncUser_unauthorizedUser_blocked() {
        String strangerEmail = "stranger.attacker@gmail.com";

        assertThatThrownBy(() -> syncService.syncUserAndHousehold("sub-stranger", strangerEmail, "侵入者", null))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("このアプリは許可された家族専用です");

        // DBにユーザーも世帯も一切作成されていないことを厳格に検証
        assertThat(userRepository.count()).isEqualTo(0);
        assertThat(householdRepository.count()).isEqualTo(0);
        assertThat(memberRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("事前に家族として招待されているメールアドレスはホワイトリスト外でもログイン・世帯参加できる")
    void syncUser_invitedFamilyMember_success() {
        // 1. オーナーを作成
        User owner = userRepository.save(new User("sub-owner", "yuki.yamagishi.contact@gmail.com", "オーナー", null));
        Household household = householdRepository.save(new Household("ファミリー世帯", owner.getId()));
        memberRepository.save(new HouseholdMember(household.getId(), owner.getId(), owner.getEmail(), "OWNER", OffsetDateTime.now()));

        // 2. 家族メンバーを事前招待
        String invitedEmail = "family.member@example.com";
        memberRepository.save(new HouseholdMember(household.getId(), null, invitedEmail, "MEMBER", null));

        // 3. 招待された家族がログイン
        var result = syncService.syncUserAndHousehold("sub-family", invitedEmail, "家族メンバー", "https://family.jpg");

        assertThat(result).isNotNull();
        assertThat(result.user().getEmail()).isEqualTo(invitedEmail);
        assertThat(result.role()).isEqualTo("MEMBER");
        assertThat(result.household().getId()).isEqualTo(household.getId());

        // 新規世帯は増えず、元の世帯に参加していること
        assertThat(householdRepository.count()).isEqualTo(1);
    }
}
