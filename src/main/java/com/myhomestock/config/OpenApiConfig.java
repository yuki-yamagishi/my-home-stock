package com.myhomestock.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MyHomeStock REST API")
                        .version("1.0.0")
                        .description("自宅在庫・買い物リスト管理 Web/PWA アプリケーション バックエンド API 仕様")
                        .contact(new Contact().name("MyHomeStock Dev Team"))
                        .license(new License().name("MIT")));
    }
}
