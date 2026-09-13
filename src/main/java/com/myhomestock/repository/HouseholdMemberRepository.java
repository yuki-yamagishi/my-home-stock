package com.myhomestock.repository;

import com.myhomestock.domain.entity.HouseholdMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdMemberRepository extends JpaRepository<HouseholdMember, Long> {
    List<HouseholdMember> findByUserId(Long userId);
    List<HouseholdMember> findByHouseholdId(Long householdId);
    Optional<HouseholdMember> findByHouseholdIdAndInvitedEmail(Long householdId, String invitedEmail);
    List<HouseholdMember> findByInvitedEmail(String invitedEmail);
    Optional<HouseholdMember> findFirstByUserIdOrderByCreatedAtAsc(Long userId);
}
