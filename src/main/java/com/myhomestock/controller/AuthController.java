package com.myhomestock.controller;

import com.myhomestock.domain.dto.AuthUserResponseDto;
import com.myhomestock.domain.security.CustomOAuth2User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "OAuth2 認証・現在ログイン中ユーザー及び世帯情報取得 API")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @GetMapping("/me")
    @Operation(summary = "現在ログイン中のユーザー情報取得", description = "現在ログインしているユーザー、所属世帯、ロール情報を取得します。未認証時は 401 を返却します。")
    public ResponseEntity<AuthUserResponseDto> getCurrentUser(@AuthenticationPrincipal CustomOAuth2User user) {
        log.info("GET /api/v1/auth/me called. User: {}", user != null ? user.getEmail() : "null (unauthenticated)");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AuthUserResponseDto dto = new AuthUserResponseDto(
                user.getUserId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPictureUrl(),
                user.getHouseholdId(),
                user.getHouseholdName(),
                user.getRole()
        );

        return ResponseEntity.ok(dto);
    }
}
