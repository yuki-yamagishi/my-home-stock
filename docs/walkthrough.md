# 実装成果レポート (Walkthrough)

> [!NOTE]
> 本ファイルは常に最新の進行中フェーズの実装成果レポートを保持します。
> 個別の Issue 成果レポートは `docs/issues/` 配下の各 Issue フォルダに完全に保全されています。

## 現在進行中: ISSUE-007 (Google OAuth2 認証とデータベース駆動型世帯管理および完全プライベートアクセスガードの導入)
詳細は [docs/issues/ISSUE-007_google_oauth2_and_household_authorization/walkthrough.md](./issues/ISSUE-007_google_oauth2_and_household_authorization/walkthrough.md) を参照。

### 成果サマリー
- **Google OAuth2 / OIDC パスワードレス認証の導入**:
  - `CustomOidcUserService` による Google OpenID Connect 認証および属性連携を確立。
  - セッション Cookie（`SameSite=Lax`, `Secure`, `HttpOnly`）による安全なセッション管理。
- **データベース駆動型世帯マルチテナント基盤の確立 (Flyway V2)**:
  - `users`, `households`, `household_members` テーブルを新設。
  - 初回ログイン時のユーザー・世帯自動生成（セルフブートストラップ）。
  - 世帯オーナーによる家族招待（Googleメールアドレス指定）および家族の世帯自動合流。
- **完全プライベートアクセスガード（未認可アカウントの門前払いと OCI 容量保護）**:
  - 認可対象を「オーナー」「事前招待家族」「世帯所属メンバー」の 3 つに厳格限定。
  - 第三者は DB レコード作成前に即座に `OAuth2AuthenticationException` で拒絶され、DB 容量消費ゼロを物理的に保証。
  - 拒絶時はログイン画面に明確に理由をフィードバック。
- **メールアドレスの正規化（英大文字・小文字の揺らぎ排除）**:
  - 招待時・ログイン時の全経路でメールアドレスを小文字化・トリム正規化し、PostgreSQL 比較でのすり抜けを根絶。

### 検証結果
- `.\mvnw.cmd test`: 100% PASS (全 23 件)
- `npm run check`: 100% PASS (QualityGateRunner, 型検査, Vitest 7 tests, Vite PWA ビルド)
- GitHub Actions CI: 100% PASS (Run #34845313385)
- OCI 本番環境: 正常稼働 (HTTP 200 `UP`)

### レビュー指摘事項と改善対応履歴
- [docs/issues/ISSUE-007_google_oauth2_and_household_authorization/walkthrough.md](./issues/ISSUE-007_google_oauth2_and_household_authorization/walkthrough.md) を参照。
