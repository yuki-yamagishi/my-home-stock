package com.myhomestock.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "現在ログイン中のユーザーおよび所属世帯情報 DTO")
public record AuthUserResponseDto(
        @Schema(description = "ユーザーID", example = "1")
        Long userId,

        @Schema(description = "メールアドレス", example = "user@gmail.com")
        String email,

        @Schema(description = "表示名", example = "山田 太郎")
        String displayName,

        @Schema(description = "プロフィール画像URL")
        String pictureUrl,

        @Schema(description = "所属世帯ID", example = "1")
        Long householdId,

        @Schema(description = "世帯名", example = "マイホーム")
        String householdName,

        @Schema(description = "世帯内ロール (OWNER / MEMBER)", example = "OWNER")
        String role
) {}
