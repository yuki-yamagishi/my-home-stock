# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-028

- **対象Issue**: [ISSUE-028] CORS オリジン厳格化（DuckDNS ワイルドカード排除）および Cookie セッションに対する CSRF 保護の導入
- **ステータス**: 🔵 着手前 (`status: ready`)
- **作成日**: 2026-10-03

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **Spring Security 6 における SPA CSRF 仕様**:
  - Spring Security 6 では、BREACH 攻撃（同一オリジン内の圧縮反射攻撃）から保護するため、トークンがデフォルトで XOR マスク（`XorCsrfTokenRequestAttributeHandler`）されます。
  - 一方、SPA では JavaScript が Cookie から平文のトークンを読み取ってリクエストヘッダー `X-XSRF-TOKEN` にセットして送信します。
  - 両者の整合性を保つため、Spring Security 公式推奨の `SpaCsrfTokenRequestHandler`（ヘッダーがある場合は平文解決、HTML 描画時は XOR 解決）パターンを採用します。
  - さらに、Spring Security 6 の `CookieCsrfTokenRepository` はトークンを遅延評価（`DeferredCsrfToken`）するため、リクエスト通過時にトークンを確実に解決してレスポンス Cookie に書き込む `CsrfCookieFilter`（`OncePerRequestFilter`）を `BasicAuthenticationFilter` の直後に配置します。
- **CORS 外部設定化**:
  - `application.yml` の `app.cors.allowed-origins` にカンマ区切りの文字列リスト（デフォルト: `http://localhost:*,http://127.0.0.1:*`）を定義し、環境変数 `CORS_ALLOWED_ORIGINS` で安全に上書き可能にします。
  - `https://*.duckdns.org` のようなオープンワイルドカードは完全排除します。

### 1.2. UX・エッジケース
- **SPA 初期起動時のトークン取得**:
  - ユーザーがブラウザでアプリを開いた際、SPA 初期画面ローディング時に実行される最初の GET リクエスト（例: `/api/v1/auth/me`）または SPA 配信（`/`）により、レスポンス Cookie として `XSRF-TOKEN` がブラウザにセットされます。
  - これにより、その後の在庫追加・編集・削除操作において、ユーザーが意識することなく CSRF トークンがヘッダーに自動付加されます。
- **ログアウト操作**:
  - ログアウト（`POST /api/v1/auth/logout`）は POST メソッドであるため、CSRF 保護が適用されます。
  - フロントエンドの `api.logout()` においても確実に `X-XSRF-TOKEN` ヘッダーを付与して呼び出すよう実装します。
- **Swagger UI / OpenAPI ドキュメントへの影響**:
  - `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` は GET メソッド中心であり、CSRF の検証対象外です。

### 1.3. データ永続性・互換性
- **データベーススキーマへの影響なし**:
  - 本変更はトランスポート層・セキュリティ層の改修であり、PostgreSQL テーブル定義、Flyway マイグレーション、JPA エンティティの変更は一切発生しません。
- **OpenAPI スキーマ互換性**:
  - API の Request Body / Response DTO の変更はないため、OpenAPI 定義（`docs/openapi.json`）の破壊的変更は生じません。

### 1.4. テスト自律性
- **MockMvc における CSRF 検証**:
  - Spring Security Test の `SecurityMockMvcRequestPostProcessors.csrf()` を使用し、既存の統合テスト（`StockItemControllerTest`, `HouseholdControllerTest`）を即座に適合させます。
  - CSRF トークンを付与しない POST リクエストが確実に 403 Forbidden になることを検証するテストケースを追加します。
- **フロントエンド単体テスト**:
  - `frontend/src/api/client.ts` の `getCsrfToken` およびヘッダー付与ロジックをテストする単体テストを追加し、Vitest でミリ秒単位で検証可能にします。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **`src/main/java/com/myhomestock/config/SecurityConfig.java`**:
  - 現在 `.csrf(AbstractHttpConfigurer::disable)` と設定されている箇所を、Spring Security 公式推奨の SPA CSRF パターンに置き換えます。
  - 現在ハードコードされている `https://*.duckdns.org` を排除し、外部設定からインジェクションされたオリジンリストを使用します。
- **`frontend/src/api/client.ts`**:
  - `request` 関数（共通 fetch ラッパー）および `logout` 関数が存在。
  - 各 API 呼び出し個別につぎはぎ（パッチワーク）するのではなく、中央集権的な `request` 関数内で `getCsrfToken()` を呼び出して状態変更リクエストの headers にマージする設計とします。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- Spring Security のエコシステムに反したオレオレ CSRF トークン生成やカスタムインターセプターを自作せず、Spring Security 公式の `CookieCsrfTokenRepository` と `SpaCsrfTokenRequestHandler` を利用します。
- フロントエンドでも外部ライブラリを過剰に追加せず、標準の `document.cookie` パースロジックで軽量・安全に実装します。
