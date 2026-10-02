# 実装成果レポート (Walkthrough Report) - ISSUE-028

- **対象Issue**: [ISSUE-028] CORS オリジン厳格化（DuckDNS ワイルドカード排除）および Cookie セッションに対する CSRF 保護の導入
- **ステータス**: 🔵 着手前 (`status: ready`)
- **作成日**: 2026-10-03

---

## 1. 実装サマリー

本タスクでは、MyHomeStock のセキュリティ基盤を強化するため、以下の2点に対応しました：
1. **CORS 設定における DuckDNS ワイルドカード排除**:
   - `https://*.duckdns.org` のワイルドカード指定を撤廃し、設定プロパティ `app.cors.allowed-origins`（環境変数 `CORS_ALLOWED_ORIGINS`）による明示的ホワイトリスト方式へ刷新しました。
2. **Cookie セッションに対する CSRF 保護の導入**:
   - Spring Security 6 標準の SPA CSRF パターン（`CookieCsrfTokenRepository.withHttpOnlyFalse()` + `SpaCsrfTokenRequestHandler` + `CsrfCookieFilter`）を導入し、状態変更 API（POST, PUT, DELETE, PATCH）に CSRF トークン（`X-XSRF-TOKEN`）の検証を物理強制しました。
   - フロントエンド（`client.ts`）において、Cookie から `XSRF-TOKEN` を抽出し、状態変更リクエストおよびログアウト処理時に自動付与する仕組みを整備しました。

---

## 2. 動作検証結果

### 2.1. バックエンド統合テスト
- `mvnw test`:
  - `SecurityCsrfCorsTest`:
    - CSRF トークンなしのリクエストが 403 Forbidden で拒絶されること
    - 不正な CSRF トークンのリクエストが 403 Forbidden で拒絶されること
    - 正しい CSRF トークンを伴うリクエストが正常に処理されること
    - 許可されていないオリジンからの CORS リクエストが拒絶されること
    - 許可されたオリジンからの CORS リクエストが許可されること
  - 既存のコントローラーテスト（`StockItemControllerTest`, `HouseholdControllerTest`）がすべて正常に PASS すること

### 2.2. フロントエンド単体テスト & 型検査
- `npm --prefix frontend run test:run`:
  - `clientCsrf.test.ts`: Cookie からのトークン抽出およびリクエストヘッダー付与が正常に動作することを検証
- `npm --prefix frontend run type-check`:
  - TypeScript Strict 型検査エラー 0 件

### 2.3. ワンショット品質ゲート
- `npm run check`:
  - シークレット漏洩検証、プラグイン配備、ADR整合性、Issue 4ドキュメント完結性、OpenAPI型同期、TypeScript型検査、フロントエンド全テスト、Vite本番ビルドがすべて PASS すること

---

## 3. レビュー指摘事項と改善対応履歴

| # | レビュアー | 指摘内容 (Conventional Comments) | 重要度 | 対応方針 / 修正コミット |
| :- | :--- | :--- | :--- | :--- |
| 1 | Fleet Reviewer | （初回レビュー待ち） | - | - |
| 2 | Completion Auditor | （初回監査待ち） | - | - |
| 3 | Stock Domain Auditor | （初回監査待ち） | - | - |
