# [ADR-0006] Spring Initializr 公式仕様に基づく Spring Boot 4 系への全面移行

* **ステータス**: 承認済
* **日付**: 2026-09-05
* **決定者**: MyHomeStock 開発チーム

---

## 1. 文脈と問題提起 (Context)
当初の要件では Spring Boot 3.x 系が指定されていましたが、Spring Initializr (`start.spring.io`) の公式提供ラインは 4.x 系（>=4.0.0）を標準としており、3.x 系を要求すると互換範囲外となります。
新規アプリケーション開発において、将来のメジャーバージョン移行作業を後回しにすることは技術的負債となるため、公式資料および `start.spring.io` の最新メタデータに則り、バックエンドを最初から最新の **Spring Boot 4 系** で統一することとしました。

---

## 2. 決定内容 (Decision)
1. **Spring Boot バージョン**: `4.0.8` (Spring Boot 4.x 安定版)
2. **公式スターター構成**:
   - `spring-boot-starter-webmvc`: Web MVC & 内蔵 Tomcat
   - `spring-boot-starter-data-jpa`: JPA / Hibernate
   - `spring-boot-starter-security`: Spring Security 7.x
   - `spring-boot-starter-validation`: Jakarta Bean Validation
   - `spring-boot-starter-flyway`: Flyway
   - `springdoc-openapi-starter-webmvc-ui:3.1.0`: Spring Boot 4 公式対応 OpenAPI 3.0 / Swagger UI
   - `spring-boot-starter-data-jpa-test`, `spring-boot-starter-webmvc-test`: Spring Boot 4 モジュラーテストスターター
3. **テストコード適合**:
   - テストアノテーションのパッケージ変更（`org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`, `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`, `org.springframework.boot.jpa.test.autoconfigure.TestEntityManager`）に対応。

---

## 3. 結果・影響 (Consequences)

### メリット
- 将来的な 3系 から 4系 へのマイグレーション作業・コストが完全ゼロ。
- `start.spring.io` の公式最新構成と完全に同期。
- Java 21+ および将来の Java LTS に向けた最新の Spring Framework 7 / Spring Boot 4 基盤をフル活用可能。

### デメリット・トレードオフ
- Spring Boot 4 のモジュラーパッケージ体系（`webmvc.test`, `data.jpa.test`）への適応が必要（すでにテスト適合・動作確認完了）。
