package com.myhomestock.service;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class UserHouseholdSyncService {

    private static final Logger log = LoggerFactory.getLogger(UserHouseholdSyncService.class);

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository householdMemberRepository;

    public UserHouseholdSyncService(UserRepository userRepository,
                                   HouseholdRepository householdRepository,
                                   HouseholdMemberRepository householdMemberRepository) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.householdMemberRepository = householdMemberRepository;
    }

    public record SyncResult(User user, Household household, String role) {}

    @Transactional
    public SyncResult syncUserAndHousehold(String sub, String email, String name, String picture) {
        log.info("syncUserAndHousehold started for sub={}, email={}, name={}", sub, email, name);

        // 1. ユーザーの永続化 / 更新
        User user = userRepository.findByGoogleSub(sub)
                .or(() -> userRepository.findByEmail(email))
                .orElseGet(() -> new User(sub, email, name, picture));

        user.setGoogleSub(sub);
        user.setEmail(email);
        user.setDisplayName(name != null ? name : email);
        user.setPictureUrl(picture);
        user = userRepository.save(user);
        final Long userId = user.getId();
        log.info("User persisted/updated: id={}, email={}", userId, email);

        // 2. 未紐付けの招待レコード（invited_email = email かつ user_id is null）があればリンク
        List<HouseholdMember> pendingInvites = householdMemberRepository.findByInvitedEmail(email);
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
                    email,
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
