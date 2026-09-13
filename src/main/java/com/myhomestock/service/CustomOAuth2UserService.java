package com.myhomestock.service;

import com.myhomestock.domain.entity.Household;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.domain.security.CustomOAuth2User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository householdMemberRepository;

    public CustomOAuth2UserService(UserRepository userRepository,
                                  HouseholdRepository householdRepository,
                                  HouseholdMemberRepository householdMemberRepository) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.householdMemberRepository = householdMemberRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String sub = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        if (email == null) {
            throw new OAuth2AuthenticationException("Google account email not found.");
        }

        // 1. ユーザーの永続化 / 更新
        User user = userRepository.findByGoogleSub(sub)
                .or(() -> userRepository.findByEmail(email))
                .orElseGet(() -> new User(sub, email, name, picture));

        user.setGoogleSub(sub);
        user.setEmail(email);
        user.setDisplayName(name != null ? name : email);
        user.setPictureUrl(picture);
        user = userRepository.save(user);

        // 2. 未紐付けの招待レコード（invited_email = email かつ user_id is null）があればリンク
        final Long userId = user.getId();
        List<HouseholdMember> pendingInvites = householdMemberRepository.findByInvitedEmail(email);
        for (HouseholdMember invite : pendingInvites) {
            if (invite.getUserId() == null) {
                invite.setUserId(userId);
                invite.setJoinedAt(OffsetDateTime.now());
                householdMemberRepository.save(invite);
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
        } else {
            // 招待も所属もない場合は新規世帯を自動生成（世帯オーナー）
            String householdName = (name != null ? name : "マイホーム") + "の世帯";
            Household newHousehold = new Household(householdName, userId);
            newHousehold = householdRepository.save(newHousehold);

            activeMember = new HouseholdMember(
                    newHousehold.getId(),
                    userId,
                    email,
                    "OWNER",
                    OffsetDateTime.now()
            );
            activeMember = householdMemberRepository.save(activeMember);
        }

        final HouseholdMember member = activeMember;

        Household household = householdRepository.findById(member.getHouseholdId())
                .orElseThrow(() -> new IllegalStateException("Household not found for id: " + member.getHouseholdId()));

        return new CustomOAuth2User(user, household, member.getRole(), oAuth2User.getAttributes());
    }
}
