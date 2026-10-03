# 実装成果レポート (Walkthrough Report) - ISSUE-028

- **対象Issue**: [ISSUE-028] CORS オリジン厳格化（DuckDNS ワイルドカード排除）および Cookie セッションに対する CSRF 保護の導入
- **ステータス**: 🟢 レビュー合議成立・マージ待ち (`status: in-progress`)
- **作成日**: 2026-10-03

---

## 1. 実装サマリー

本タスクでは、MyHomeStock のセキュリティ基盤を強化するため、以下の2点に対応しました：
1. **CORS 設定における DuckDNS ワイルドカード排除**:
   - `https://*.duckdns.org` のワイルドカード指定を撤廃し、設定プロパティ `app.cors.allowed-origins`（環境変数 `CORS_ALLOWED_ORIGINS`）による明示的ホワイトリスト方式へ刷新しました（デフォルト: `http://localhost:*,http://127.0.0.1:*`）。
2. **Cookie セッションに対する CSRF 保護の導入**:
   - Spring Security 6 標準の SPA CSRF パターン（`CookieCsrfTokenRepository.withHttpOnlyFalse()` + `CsrfTokenRequestAttributeHandler` + `CsrfCookieFilter`）を導入し、状態変更 API（POST, PUT, DELETE, PATCH）に CSRF トークン（`X-XSRF-TOKEN`）の検証を物理強制しました。
   - `CsrfCookieFilter` により、認証済みリクエストに対してレスポンス Cookie（`Set-Cookie: XSRF-TOKEN=...; Path=/`）を自動発行・保存。
   - フロントエンド（`frontend/src/api/client.ts`）において、Cookie から `XSRF-TOKEN` を抽出し、状態変更リクエストおよびログアウト処理時に自動付与する仕組み（`getCsrfToken()`, `parseCsrfToken()`）を整備しました。
3. **デプロイ環境における環境変数透過スロット整備**:
   - `docker-compose.prod.yml` および `docker-compose.yml` の `app` サービスに `CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-}` を追加。
   - 本番ドメイン等の環境依存値を Git にハードコードせず、ホストの `.env` から安全にコンテナへ注入できる構成を確立。
   - デプロイ設定テンプレート `.env.example` を新設。

---

## 2. 動作検証結果

### 2.1. バックエンド統合テスト
- `mvnw test`: **Tests run: 34, Failures: 0, Errors: 0, Skipped: 0 (BUILD SUCCESS)**
  - `SecurityCsrfCorsTest`:
    - `testCorsDisallowedOrigin`: 拒絶オリジン（`https://attacker.duckdns.org`）からの CORS プリフライトが 403 Forbidden で拒絶されることを確認。
    - `testCorsAllowedOrigin`: 許可オリジン（`http://localhost:5173`）からの CORS プリフライトに `Access-Control-Allow-Origin` および `Access-Control-Allow-Credentials: true` が返ることを確認。
    - `testMutatingRequestWithoutCsrfTokenReturns403`: CSRF トークンなしのリクエストが 403 Forbidden で拒絶されることを確認。
    - `testMutatingRequestWithInvalidCsrfTokenReturns403`: 不正な CSRF トークンのリクエストが 403 Forbidden で拒絶されることを確認。
    - `testMutatingRequestWithValidCsrfTokenSucceeds`: 正しい `XSRF-TOKEN` Cookie および `X-XSRF-TOKEN` ヘッダーを伴うリクエストが正常に 201 Created となることを確認。
  - 既存テスト（`StockItemControllerTest`, `HouseholdControllerTest` 等）も `.with(csrf())` 対応により全件 PASS。

### 2.2. フロントエンド単体テスト & 型検査
- `npm.cmd run test:fast` (Vitest): **Tests: 45 passed (45/45)**
  - `clientCsrf.test.ts`: 11 件すべてのテストが PASS（トークン抽出、URIデコード、POST/PUT/DELETE/Logout へのヘッダー付与、GET への非付与）。
- `npm.cmd run check:fast` (tsc --noEmit): **Strict 型検査エラー 0 件**

### 2.3. ワンショット品質ゲート (Outer Loop)
- `npm.cmd run check`: **ALL PASSED**
  - シークレットスキャン: 224 ファイル検知 0 件
  - プラグイン & Submodule 整合性: 合格
  - ADR 14件 & Issue 4ドキュメント整合性: 合格
  - OpenAPI 3.0 型同期: 合格
  - TypeScript Strict 型検査: 合格
  - Vitest 単体テスト全件 (45/45): 合格
  - Vite プロダクションビルド & PWA Manifest: 合格 (`dist/` 生成完了)

---

## 3. レビュー指摘事項と改善対応履歴

| # | レビュアー | 指摘内容 (Conventional Comments) | 重要度 | 対応方針 / 修正コミット |
| :- | :--- | :--- | :--- | :--- |
| 1 | Fleet Reviewer | `[good]` CORS ワイルドカード排除と外部化、`logout` への CSRF ヘッダー明示付与、網羅的なテストスイートを高く評価。ブロッキング指摘なし。 | `[good]` | 合議承認 (`LGTM`) |
| 2 | Completion Auditor | `[good]` Why-First 原則、4大排除リスクの封じ込め、全10項目の受け入れ基準（DoD）の完遂を確認。ブロッキング指摘なし。 | `[good]` | 合議承認 (`LGTM`) |
| 3 | Stock Domain Auditor | `[good]` JPA楽観排他、世帯マルチテナント分離、純粋コアロジック不可侵（core/への非依存維持、client.tsへの局所化）、OpenAPI型安全の4大ドメイン原則の完全遵守を確認。 | `[good]` | 合議承認 (`LGTM`) |
