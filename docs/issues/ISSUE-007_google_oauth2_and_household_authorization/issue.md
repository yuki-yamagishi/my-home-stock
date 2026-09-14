# [ISSUE-007] Google OAuth2 認証とデータベース駆動型世帯管理および完全プライベートアクセスガードの導入

* **ステータス**: 🟣 `status: in-progress`
* **種別**: 🟢 `type: feature` / 🛡️ `type: security`
* **担当者**: AIエージェント
* **作成日**: 2026-09-14
* **関連 ADR / GitHub Issue**: [ADR-0010](../../adr/0010-google-oauth2-database-household-authorization.md) / GitHub Issue #8

---

## 📌 課題の概要・背景 (Problem Description / Context)

ADR-0007 による OCI Single JAR アーキテクチャおよび Caddy リバースプロキシによる常時 HTTPS（`https://ymgs-mhs-j.duckdns.org`）の開通に伴い、アプリケーションがパブリックインターネット上に本番稼働した。
しかし、認証認可の欠落（`permitAll`）およびクライアント主導の世帯分離（`X-Household-Id` 偽装リスク）という重大なセキュリティ脆弱性が存在していた。
さらに、不特定多数の Google アカウントによる勝手なログイン・世帯作成を許容すると、OCI Always Free DB のリソースやストレージ容量を食いつぶされる深刻なリスクが生じる。

このため、コアドメインである「世帯」と「ユーザー」をデータベース駆動型で正攻法に設計（パターンB）し、かつ未認可アカウントを DB 書き込みゼロで完全に門前払いする物理ガードを導入する。

---

## 🎯 要件定義 (Requirements)

1. **Google OAuth2 / OIDC 認証基盤**:
   - `spring-boot-starter-oauth2-client` を導入し、パスワードレスで Google アカウントによる認証を確立。
   - `CustomOidcUserService` および `CustomOAuth2UserService` により、Google の OpenID Connect 認証からユーザー情報を解決。
2. **データベース駆動型の世帯マルチテナント基盤 (Flyway V2)**:
   - `users`, `households`, `household_members` テーブルを新設。
   - 初回ログイン時にユーザーおよび初期世帯を自動生成（セルフブートストラップ）。
   - 世帯オーナーによる家族招待（Googleメールアドレス指定）と、家族の既存世帯合流基盤。
3. **サーバー主導の世帯認可境界**:
   - `StockItemController` から `X-Household-Id` ヘッダーを完全撤廃。
   - 認証プリンシパルからサーバー側で所属世帯を一意に特定し、未認証アクセスは 401 Unauthorized で遮断。
4. **完全プライベートアクセスガード（未認可ユーザーの門前払いと OCI 容量食いつぶし防止）**:
   - 認可対象を「環境変数 `ALLOWED_EMAILS` のオーナー」または「世帯オーナーから事前招待された家族（`household_members.invited_email`）」、または「既存世帯現役メンバー」に限定。
   - 第三者は DB レコード（`users`, `households`, `household_members`）を 1 行も作成する前に `OAuth2AuthenticationException` で即座にアクセス拒絶（ストレージ消費ゼロ）。
   - ログイン画面に「許可された家族専用です」と明確に赤字でエラー表示。

---

## 🛠️ 技術設計・実装方針 (Technical Notes / Design)

- **バックエンド**:
  - `SecurityConfig.java`: OIDC / OAuth2 ログインハンドラー、セッション Cookie（`SameSite=Lax`, `Secure`, `HttpOnly`）設定。
  - `UserHouseholdSyncService.java`: 門前払い物理ガード（`isAllowed`）、メールアドレス小文字正規化、ユーザー・世帯・メンバーの同期。
  - `HouseholdService.java`: 世帯メンバー一覧取得、家族招待（OWNER権限強制、二重招待防止）。
- **フロントエンド**:
  - `LoginCard.tsx`: Google ログインボタン、認証エラーメッセージ表示カード。
  - `Header.tsx`: ログインユーザー名・アイコン・所属世帯表示、家族メンバー管理モーダル起動。
  - `FamilyMembersModal.tsx`: メンバー一覧・招待フォーム。
- **インフラ**:
  - OCI `.env` に `ALLOWED_EMAILS` を設定し、Docker Compose 経由で注入。

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [x] Google アカウントによるログイン・ログアウトが正常に動作すること
- [x] 未認可の第三者アカウントは DB 書き込みゼロで即座に拒絶され、エラーが表示されること
- [x] 事前招待された家族はホワイトリスト外でもログイン・世帯参加できること
- [x] 英大文字・小文字の表記揺れに関わらず確実に招待紐付けが行われること
- [x] `UserHouseholdSyncServiceTest` 等の単体・結合テストが全件 PASS すること
- [x] `npm run check`（型検査、Vitest、ビルド、シークレット検査）が 100% 合格すること
- [x] OCI 本番環境にデプロイされ、正常稼働すること
