package com.myhomestock.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "household_members", uniqueConstraints = {
        @UniqueConstraint(name = "uq_household_member", columnNames = {"household_id", "invited_email"})
})
public class HouseholdMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "household_id", nullable = false)
    private Long householdId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "invited_email", nullable = false, length = 255)
    private String invitedEmail;

    @Column(nullable = false, length = 50)
    private String role; // OWNER, MEMBER

    @Column(name = "joined_at")
    private OffsetDateTime joinedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public HouseholdMember() {
    }

    public HouseholdMember(Long householdId, Long userId, String invitedEmail, String role, OffsetDateTime joinedAt) {
        this.householdId = householdId;
        this.userId = userId;
        this.invitedEmail = invitedEmail;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        if (this.role == null) {
            this.role = "MEMBER";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHouseholdId() { return householdId; }
    public void setHouseholdId(Long householdId) { this.householdId = householdId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getInvitedEmail() { return invitedEmail; }
    public void setInvitedEmail(String invitedEmail) { this.invitedEmail = invitedEmail; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public OffsetDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(OffsetDateTime joinedAt) { this.joinedAt = joinedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
