# 実装成果レポート (Walkthrough) - ISSUE-007

- **対象Issue**: ISSUE-007: Google OAuth2 認証とデータベース駆動型世帯管理および完全プライベートアクセスガードの導入
- **ステータス**: 🟢 完了・検証済 (`status: completed`)
- **作成日**: 2026-09-14
- **関連 GitHub Issue**: #8

---

## 1. 成果サマリー

1. **Google OAuth2 / OIDC パスワードレス認証の完全導入**:
   - `CustomOidcUserService` による Google OpenID Connect 認証および属性連携を確立。
   - ログイン成功時に自動で世帯ダッシュボードへ遷移し、セッション Cookie（`SameSite=Lax`, `Secure`, `HttpOnly`）を安全に発行。
2. **データベース駆動型世帯マルチテナント基盤の確立 (Flyway V2)**:
   - `users`, `households`, `household_members` テーブルを新設。
   - 初回ログイン時のユーザー・世帯自動生成（セルフブートストラップ）。
   - 世帯オーナーによる家族招待（Googleメールアドレス指定）および家族の世帯自動合流。
3. **完全プライベートアクセスガード（未認可アカウントの門前払いと OCI 容量食いつぶし防止）**:
   - 認可対象を「環境変数 `ALLOWED_EMAILS` のオーナー」「事前招待された家族」「既存世帯メンバー」の 3 つに厳格限定。
   - 第三者は DB レコード作成前に即座に `OAuth2AuthenticationException` で拒絶され、DB 容量消費ゼロを物理的に保証。
   - 拒絶時はログイン画面に赤字で明確に理由をフィードバック。
4. **メールアドレスの正規化（英大文字・小文字の揺らぎ排除）**:
   - 招待時・ログイン時の全経路でメールアドレスを小文字化・トリム正規化し、PostgreSQL 比較でのすり抜けを根絶。

---

## 2. 検証結果

- [x] バックエンド単体・結合テスト全件 PASS (`.\mvnw.cmd test` 計23件)
- [x] 統合品質ゲート PASS (`npm.cmd run check`: 型検査、Vitest、ビルド、シークレットスキャン)
- [x] GitHub Actions CI 全ジョブ PASS (Run #34845313385)
- [x] OCI 本番環境稼働確認 (HTTP 200 `UP`)

---

## 3. レビュー指摘事項と改善対応履歴 (Review Feedback & Iterations)

| 重要度 | 指摘・改善課題 | 対応内容 | 反映ファイル |
| :--- | :--- | :--- | :--- |
| `[must]` | 未認可ユーザーによる OCI 容量食いつぶしリスク (ユーザー指摘) | `UserHouseholdSyncService` 冒頭に門前払い物理ガード `isAllowed` を導入し、DB 書き込み前に即時例外送出（ストレージ消費ゼロ） | `UserHouseholdSyncService.java`, `SecurityConfig.java` |
| `[must]` | テナント分離バイパス脆弱性 (Fleetレビュー指摘) | `StockItemService.createStockItem` でリクエストの世帯IDを完全無視し、認証世帯IDを強制。`StockItemController` から `X-Household-Id` を全廃 | `StockItemService.java`, `StockItemController.java` |
| `[must]` | 世帯招待の認可漏れ (Fleetレビュー指摘) | `HouseholdService.inviteMember` にて世帯 OWNER ロールチェックを強制 | `HouseholdService.java` |
| `[should]`| Google アカウント英大文字混じり時の招待紐付け漏れ | `UserHouseholdSyncService` 内で `normalizedEmail`（小文字化）に統一し、DB 検索・保存を正規化 | `UserHouseholdSyncService.java` |
| `[must]` | CI 環境でのテストデータ衝突 (H2 ユニーク制約違反) | `UserHouseholdSyncServiceTest` の `@Transactional` を撤廃し、テストケースごとに一意な ID（`sub-owner-invite`, `sub-owner-case` 等）を割り振りデータ分離 | `UserHouseholdSyncServiceTest.java` |
