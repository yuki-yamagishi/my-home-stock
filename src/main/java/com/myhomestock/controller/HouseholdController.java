package com.myhomestock.controller;

import com.myhomestock.domain.dto.HouseholdMemberRequestDto;
import com.myhomestock.domain.dto.HouseholdMemberResponseDto;
import com.myhomestock.domain.security.CustomOAuth2User;
import com.myhomestock.service.HouseholdService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/households")
@Tag(name = "Household", description = "世帯・家族メンバー管理 API")
public class HouseholdController {

    private final HouseholdService householdService;

    public HouseholdController(HouseholdService householdService) {
        this.householdService = householdService;
    }

    @GetMapping("/members")
    @Operation(summary = "所属世帯メンバー一覧取得", description = "ログイン中ユーザーの世帯メンバー一覧を取得します。")
    public ResponseEntity<List<HouseholdMemberResponseDto>> getMembers(@AuthenticationPrincipal CustomOAuth2User user) {
        if (user == null || user.getHouseholdId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(householdService.getHouseholdMembers(user.getHouseholdId()));
    }

    @PostMapping("/members")
    @Operation(summary = "家族メンバー招待", description = "指定したGoogleメールアドレスを所属世帯に招待します。")
    public ResponseEntity<HouseholdMemberResponseDto> inviteMember(
            @AuthenticationPrincipal CustomOAuth2User user,
            @Valid @RequestBody HouseholdMemberRequestDto requestDto) {
        if (user == null || user.getHouseholdId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        HouseholdMemberResponseDto response = householdService.inviteMember(
                user.getHouseholdId(),
                user.getUserId(),
                requestDto
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
