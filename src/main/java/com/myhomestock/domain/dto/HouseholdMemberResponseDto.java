package com.myhomestock.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;

@Schema(description = "世帯メンバー情報 DTO")
public record HouseholdMemberResponseDto(
        @Schema(description = "メンバーシップID", example = "1")
        Long id,

        @Schema(description = "世帯ID", example = "1")
        Long householdId,

        @Schema(description = "ユーザーID (未ログイン時はnull)", example = "2")
        Long userId,

        @Schema(description = "Googleメールアドレス", example = "family@gmail.com")
        String email,

        @Schema(description = "表示名 (未ログイン時はnull)", example = "山田 花子")
        String displayName,

        @Schema(description = "ロール (OWNER / MEMBER)", example = "MEMBER")
        String role,

        @Schema(description = "参加ステータス (JOINED / INVITED)", example = "JOINED")
        String status,

        @Schema(description = "参加日時")
        OffsetDateTime joinedAt
) {}
