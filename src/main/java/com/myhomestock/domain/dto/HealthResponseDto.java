package com.myhomestock.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

@Schema(description = "ヘルスチェックレスポンス")
public class HealthResponseDto {

    @Schema(description = "サービス状態", example = "UP")
    private String status;

    @Schema(description = "サービス名", example = "MyHomeStock Backend")
    private String service;

    @Schema(description = "サーバー時刻")
    private OffsetDateTime timestamp;

    public HealthResponseDto() {
    }

    public HealthResponseDto(String status, String service, OffsetDateTime timestamp) {
        this.status = status;
        this.service = service;
        this.timestamp = timestamp;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public static class Builder {
        private String status;
        private String service;
        private OffsetDateTime timestamp;

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder service(String service) {
            this.service = service;
            return this;
        }

        public Builder timestamp(OffsetDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public HealthResponseDto build() {
            return new HealthResponseDto(status, service, timestamp);
        }
    }
}
