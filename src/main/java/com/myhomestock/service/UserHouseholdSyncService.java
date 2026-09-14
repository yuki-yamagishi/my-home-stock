package com.myhomestock.service;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserHouseholdSyncService {

    private static final Logger log = LoggerFactory.getLogger(UserHouseholdSyncService.class);

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository householdMemberRepository;
    private final String allowedEmailsConfig;

    public UserHouseholdSyncService(UserRepository userRepository,
                                   HouseholdRepository householdRepository,
                                   HouseholdMemberRepository householdMemberRepository,
                                   @Value("${app.security.allowed-emails:}") String allowedEmailsConfig) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.householdMemberRepository = householdMemberRepository;
        this.allowedEmailsConfig = allowedEmailsConfig;
    }

    public record SyncResult(User user, Household household, String role) {}

    public boolean isAllowed(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String normalized = email.trim().toLowerCase();

        // 1. 環境変数・設定ファイルの許可ホワイトリストに含まれているか（オーナー）
        if (allowedEmailsConfig != null && !allowedEmailsConfig.isBlank()) {
            for (String allowed : allowedEmailsConfig.split(",")) {
                if (normalized.equalsIgnoreCase(allowed.trim())) {
                    return true;
                }
            }
        }

        // 2. 既存世帯オーナーから事前に招待されている家族メンバー（未承認招待を含む）
        if (!householdMemberRepository.findByInvitedEmail(normalized).isEmpty()) {
            return true;
        }

        // 3. 既にいずれかの世帯に正当に所属している既存アクティブメンバー
        Optional<User> existingUser = userRepository.findByEmail(normalized);
        if (existingUser.isPresent() && !householdMemberRepository.findByUserId(existingUser.get().getId()).isEmpty()) {
            return true;
        }

        return false;
    }

    @Transactional
    public SyncResult syncUserAndHousehold(String sub, String email, String name, String picture) {
        String normalizedEmail = (email != null) ? email.trim().toLowerCase() : "";
        log.info("syncUserAndHousehold started for sub={}, email={}, name={}", sub, normalizedEmail, name);

        // 門前払い物理ガード: 許可されていないアカウントは即時拒絶（DBへの一切の書き込みを防止）
        if (!isAllowed(normalizedEmail)) {
            log.warn("Access DENIED for unauthorized/uninvited account: email={}", normalizedEmail);
            String denialMessage = "このアプリは許可された家族専用です。アクセス権限がありません。(" + normalizedEmail + ")";
            throw new OAuth2AuthenticationException(new OAuth2Error("access_denied", denialMessage, null), denialMessage);
        }

        // 1. ユーザーの永続化 / 更新
        User user = userRepository.findByGoogleSub(sub)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .orElseGet(() -> new User(sub, normalizedEmail, name, picture));

        user.setGoogleSub(sub);
        user.setEmail(normalizedEmail);
        user.setDisplayName(name != null ? name : normalizedEmail);
        user.setPictureUrl(picture);
        user = userRepository.save(user);
        final Long userId = user.getId();
        log.info("User persisted/updated: id={}, email={}", userId, normalizedEmail);

        // 2. 未紐付けの招待レコード（invited_email = normalizedEmail かつ user_id is null）があればリンク
        List<HouseholdMember> pendingInvites = householdMemberRepository.findByInvitedEmail(normalizedEmail);
        for (HouseholdMember invite : pendingInvites) {
            if (invite.getUserId() == null) {
                invite.setUserId(userId);
                invite.setJoinedAt(OffsetDateTime.now());
                householdMemberRepository.save(invite);
                log.info("Linked pending invite id={} to user id={}", invite.getId(), userId);
            }
        }

        // 3. 所属世帯の解決
        List<HouseholdMember> allMemberships = householdMemberRepository.findByUserId(userId);
        HouseholdMember activeMember = null;

        if (!allMemberships.isEmpty()) {
            // 家族として招待された世帯（MEMBER）がある場合、家族共有を最優先
            activeMember = allMemberships.stream()
                    .filter(m -> "MEMBER".equalsIgnoreCase(m.getRole()))
                    .findFirst()
                    .orElse(allMemberships.get(allMemberships.size() - 1)); // なければ直近の世帯
            log.info("Resolved existing active membership: householdId={}, role={}", activeMember.getHouseholdId(), activeMember.getRole());
        } else {
            // 招待も所属もない場合は新規世帯を自動生成（世帯オーナー）
            String householdName = (name != null ? name : "マイホーム") + "の世帯";
            Household newHousehold = new Household(householdName, userId);
            newHousehold = householdRepository.save(newHousehold);
            log.info("Created new household id={}, name={}", newHousehold.getId(), householdName);

            activeMember = new HouseholdMember(
                    newHousehold.getId(),
                    userId,
                    normalizedEmail,
                    "OWNER",
                    OffsetDateTime.now()
            );
            activeMember = householdMemberRepository.save(activeMember);
            log.info("Created new owner membership for household id={}", newHousehold.getId());
        }

        final HouseholdMember member = activeMember;

        Household household = householdRepository.findById(member.getHouseholdId())
                .orElseThrow(() -> new IllegalStateException("Household not found for id: " + member.getHouseholdId()));

        return new SyncResult(user, household, member.getRole());
    }
}
