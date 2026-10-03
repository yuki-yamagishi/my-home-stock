# 実装計画書 (Implementation Plan) - ISSUE-028

- **対象Issue**: [ISSUE-028] CORS オリジン厳格化（DuckDNS ワイルドカード排除）および Cookie セッションに対する CSRF 保護の導入
- **ステータス**: 🔵 着手前 (`status: ready`)
- **作成日**: 2026-10-03

---

## 1. タスク一覧と実装ステップ

### Step 1: ADR-0014 の作成
- `docs/adr/0014-cors-strict-origin-and-spa-csrf-protection.md` を作成し、アーキテクチャ設計決定を記録する。
- `docs/adr/README.md` の一覧テーブルに登録する。

### Step 2: バックエンド CORS 設定の外部化とワイルドカード排除
- `src/main/resources/application.yml` および `application-test.yml` に `app.cors.allowed-origins` プロパティを追加。
- `src/main/java/com/myhomestock/config/SecurityConfig.java` において、`@Value("${app.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")` をインジェクションし、DuckDNS ワイルドカードを完全に排除。

### Step 3: バックエンド CSRF 保護の有効化（Spring Security 6 SPA パターン）
- `SecurityConfig.java` に以下のコンポーネントを導入：
  1. `SpaCsrfTokenRequestHandler`: SPA の平文ヘッダーと XOR マスクの両立ハンドラ
  2. `CsrfCookieFilter`: 遅延ロードされる `CsrfToken` をレスポンス Cookie（`XSRF-TOKEN`）へ確実に書き込むフィルター
  3. `CookieCsrfTokenRepository.withHttpOnlyFalse()`: JavaScript から参照可能な Cookie 発行
- `securityFilterChain` で CSRF を有効化し、`CsrfCookieFilter` を `BasicAuthenticationFilter` の直後に登録。

### Step 4: バックエンドテストの改修・新規テスト追加
- 既存のコントローラーテスト（`StockItemControllerTest`, `HouseholdControllerTest`）の POST / PUT リクエストに `.with(csrf())` を追加。
- `CsrfSecurityTest.java`（新規）:
  - CSRF トークンなしの POST リクエストが 403 Forbidden になることを検証。
  - 不正な CSRF トークンの POST リクエストが 403 Forbidden になることを検証。
  - 正しい CSRF トークンの POST リクエストが通過することを検証。
- `CorsSecurityTest.java`（新規）:
  - 未許可オリジン（`https://attacker.duckdns.org`）からのリクエストに CORS ヘッダーが返却されないことを検証。
  - 許可オリジン（`http://localhost:5173`）からのリクエストに CORS ヘッダーが返却されることを検証。

### Step 5: フロントエンド API クライアントにおける CSRF トークン自動付与
- `frontend/src/api/client.ts` において：
  - `getCsrfToken()` ヘルパー関数を実装（`document.cookie` から `XSRF-TOKEN` をパース）。
  - `request` 関数内で、状態変更メソッド（POST, PUT, DELETE, PATCH）の場合に `X-XSRF-TOKEN` ヘッダーを自動付与。
  - `logout` 関数においても `X-XSRF-TOKEN` ヘッダーを付与。
- `frontend/tests/api/clientCsrf.test.ts` を作成し、Vitest で CSRF ヘッダー付与動作を単体テスト。

### Step 6: 全体品質ゲート通過・ドキュメント更新
- `npm.cmd run check`（シークレットスキャン、プラグイン検証、ADR・Issue整合性、型検査、フロントエンド全テスト、プロダクションビルド）を実行。
- `./mvnw test`（バックエンド全テスト）を実行。
- `docs/issues/ISSUE-028_cors_strict_origin_and_csrf_protection/walkthrough.md` に成果と検証結果を記録。

---

## 2. 変更対象ファイル一覧

| ファイルパス | 変更種別 | 変更内容 |
| :--- | :--- | :--- |
| `docs/adr/0014-cors-strict-origin-and-spa-csrf-protection.md` | 新規 | CORS厳格化とSPA CSRF保護の設計決定記録 |
| `docs/adr/README.md` | 変更 | ADR-0014 のインデックス追記 |
| `src/main/resources/application.yml` | 変更 | `app.cors.allowed-origins` プロパティの追加 |
| `src/main/resources/application-test.yml` | 変更 | テスト用 CORS プロパティの追加 |
| `src/main/java/com/myhomestock/config/SecurityConfig.java` | 変更 | CORSワイルドカード排除、SPA CSRF保護設定の導入 |
| `src/test/java/com/myhomestock/StockItemControllerTest.java` | 変更 | 状態変更リクエストへの `.with(csrf())` 付与 |
| `src/test/java/com/myhomestock/HouseholdControllerTest.java` | 変更 | 状態変更リクエストへの `.with(csrf())` 付与 |
| `src/test/java/com/myhomestock/SecurityCsrfCorsTest.java` | 新規 | CSRF遮断・受容およびCORS拒絶・許可の統合テスト |
| `frontend/src/api/client.ts` | 変更 | `getCsrfToken()` 実装およびリクエストヘッダーへの付与 |
| `frontend/tests/api/clientCsrf.test.ts` | 新規 | クライアント側 CSRF ヘッダー付与の Vitest 単体テスト |
| `docs/issues/ISSUE-028_cors_strict_origin_and_csrf_protection/walkthrough.md` | 変更 | 成果レポート・レビュー履歴の記録 |
