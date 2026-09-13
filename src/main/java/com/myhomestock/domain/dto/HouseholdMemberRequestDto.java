package com.myhomestock.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "家族メンバー招待リクエスト DTO")
public record HouseholdMemberRequestDto(
        @NotBlank(message = "招待するGoogleメールアドレスを入力してください")
        @Email(message = "正しいメールアドレス形式で入力してください")
        @Schema(description = "招待する家族のGoogleメールアドレス", example = "family@gmail.com")
        String email,

        @Schema(description = "ロール（未指定時は MEMBER）", example = "MEMBER")
        String role
) {}
