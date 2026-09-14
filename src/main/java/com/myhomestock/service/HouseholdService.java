package com.myhomestock.service;

import com.myhomestock.domain.dto.HouseholdMemberRequestDto;
import com.myhomestock.domain.dto.HouseholdMemberResponseDto;
import com.myhomestock.domain.entity.HouseholdMember;
import com.myhomestock.domain.entity.User;
import com.myhomestock.repository.HouseholdMemberRepository;
import com.myhomestock.repository.HouseholdRepository;
import com.myhomestock.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository householdMemberRepository;
    private final UserRepository userRepository;

    public HouseholdService(HouseholdRepository householdRepository,
                            HouseholdMemberRepository householdMemberRepository,
                            UserRepository userRepository) {
        this.householdRepository = householdRepository;
        this.householdMemberRepository = householdMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<HouseholdMemberResponseDto> getHouseholdMembers(Long householdId) {
        List<HouseholdMember> members = householdMemberRepository.findByHouseholdId(householdId);

        List<Long> userIds = members.stream()
                .map(HouseholdMember::getUserId)
                .filter(java.util.Objects::nonNull)
                .toList();

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return members.stream().map(m -> {
            User user = m.getUserId() != null ? userMap.get(m.getUserId()) : null;
            String displayName = user != null ? user.getDisplayName() : null;
            String status = m.getUserId() != null ? "JOINED" : "INVITED";

            return new HouseholdMemberResponseDto(
                    m.getId(),
                    m.getHouseholdId(),
                    m.getUserId(),
                    m.getInvitedEmail(),
                    displayName,
                    m.getRole(),
                    status,
                    m.getJoinedAt()
            );
        }).toList();
    }

    @Transactional
    public HouseholdMemberResponseDto inviteMember(Long householdId, Long requestingUserId, HouseholdMemberRequestDto requestDto) {
        // 1. リクエスト送信者が当該世帯の OWNER であるか検証
        List<HouseholdMember> callerMemberships = householdMemberRepository.findByUserId(requestingUserId);
        boolean isOwner = callerMemberships.stream()
                .anyMatch(m -> m.getHouseholdId().equals(householdId) && "OWNER".equalsIgnoreCase(m.getRole()));

        if (!isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("操作権限がありません。世帯管理者（オーナー）のみが家族を招待できます。");
        }

        String email = requestDto.email().trim().toLowerCase();

        // 2. 既に同じメールアドレスが当該世帯に存在しないかチェック
        Optional<HouseholdMember> existing = householdMemberRepository.findByHouseholdIdAndInvitedEmail(householdId, email);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("指定されたメールアドレス（" + email + "）は既に世帯に登録または招待されています。");
        }

        // 3. 既存ユーザーが存在する場合は即時リンク、いなければ招待状態
        Optional<User> existingUser = userRepository.findByEmail(email);
        Long linkedUserId = existingUser.map(User::getId).orElse(null);
        OffsetDateTime joinedAt = existingUser.isPresent() ? OffsetDateTime.now() : null;
        String role = (requestDto.role() != null && !requestDto.role().isBlank()) ? requestDto.role().trim().toUpperCase() : "MEMBER";
        if (!"MEMBER".equals(role) && !"OWNER".equals(role)) {
            throw new IllegalArgumentException("ロールは MEMBER または OWNER を指定してください。");
        }

        HouseholdMember member = new HouseholdMember(householdId, linkedUserId, email, role, joinedAt);
        HouseholdMember saved = householdMemberRepository.save(member);

        String displayName = existingUser.map(User::getDisplayName).orElse(null);
        String status = linkedUserId != null ? "JOINED" : "INVITED";

        return new HouseholdMemberResponseDto(
                saved.getId(),
                saved.getHouseholdId(),
                saved.getUserId(),
                saved.getInvitedEmail(),
                displayName,
                saved.getRole(),
                status,
                saved.getJoinedAt()
        );
    }
}
