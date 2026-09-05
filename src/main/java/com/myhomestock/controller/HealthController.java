package com.myhomestock.controller;

import com.myhomestock.domain.dto.HealthResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Check", description = "サービス死活監視・稼働確認 API")
public class HealthController {

    @GetMapping
    @Operation(summary = "ヘルスチェック", description = "サーバーの稼働状態とタイムスタンプを返却します")
    public ResponseEntity<HealthResponseDto> getHealth() {
        return ResponseEntity.ok(HealthResponseDto.builder()
                .status("UP")
                .service("MyHomeStock Backend")
                .timestamp(OffsetDateTime.now())
                .build());
    }
}
