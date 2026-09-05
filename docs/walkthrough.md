# 実装成果レポート (Walkthrough)

本ドキュメントは、**MyHomeStock** 開発ハーネス構築フェーズおよび OCI Single JAR 統合・世帯マルチテナント基盤の完了報告と検証成果ログです。

---

## 1. 達成成果一覧（成果）

### ① OCI Consolidated Single JAR アーキテクチャの確立
- リポジトリルートを標準 Maven プロジェクトとし、Spring Boot 4.0.8 (Spring Framework 7.0.9, Java 21) をルート直下に配置。IntelliJ IDEA でのネイティブ認識・DX を最大化。
- `frontend-maven-plugin` (1.15.1) と `maven-resources-plugin` を連携させ、`mvn package` 時に `frontend/` の React PWA を自動ビルドして `target/classes/static/` に内包。
- `SpaWebMvcConfig`（`WebMvcConfigurer` + `PathResourceResolver`）により、深層リンクや画面リロード時にも 404 を起こさず `/index.html` にルーティングする SPA フォールバックを実装。
- 同一オリジン配信により本番環境での CORS 制約を完全撤廃。

### ② 家族共有・世帯マルチテナント基盤 (`household_id`) の先行導入
- Flyway マイグレーション `V1__init_schema.sql`、JPA エンティティ `StockItem`、リクエスト/レスポンス DTO、リポジトリ、サービス、コントローラーに `household_id` カラム（デフォルト `'default'`）を先行配備。
- API リクエストヘッダー `X-Household-Id` による透過的な世帯分離をサポート。単一世帯利用時の後方互換性を保ちながら、将来のアカウント・家族共有追加時にスキーマ破壊ゼロを実現。

### ③ バックエンド（Spring Boot 4 / Java 21 / PostgreSQL 16 / H2）
- 楽観的排他制御: `StockItem` エンティティに `@Version private Long version;` を実装し、複数端末での同時更新競合時に HTTP 409 Conflict を返却する `GlobalExceptionHandler` を完備。
- スキーマ管理: `src/main/resources/db/migration/V1__init_schema.sql` による初期テーブルおよび世帯・カテゴリ・期限インデックス定義。
- テスト自動化: H2 インメモリ DB による単体・リポジトリ・コントローラー結合テスト（8/8 tests passed）を作成し、世帯分離・楽観的排他制御・数量消費・ヘルスチェックを自動検証。

### ④ フロントエンド（React / TypeScript / PWA / Tailwind）
- モバイル・デスクトップ両対応の PWA 設定 (`vite-plugin-pwa`)。Service Worker によるオフラインキャッシュと Web App Manifest を生成。
- クリーンアーキテクチャ: `frontend/src/core/stockStatus.ts` に純粋ビジネスロジックを分離し、DOM 非依存で Vitest 100% 単体テスト合格。
- 状態管理: TanStack Query による自動キャッシュ管理・再検証と楽観的排他エラー時のリカバリハンドリング。

### ⑤ OpenAPI 3.0 & TypeScript 型同期パイプライン
- `docs/openapi.json` および SpringDoc `/v3/api-docs` から `openapi-typescript` を用いて `frontend/src/api/schema.d.ts` を 35ms で自動生成する `scripts/syncApi.js` を配備。

### ⑥ 品質 & セキュリティガードレール
- `scripts/securityCheck.js`: APIキーや秘密鍵、禁止 `.env` ファイルの誤混入を自動スキャン。
- `scripts/docCheck.js`: 必須ドキュメントと ADR インデックス（ADR-0001〜0007）の整合性を自動検証。
- `AGENTS.md` & `.agents/skills/dev-harness/SKILL.md`: AIエージェントと人間の実務 GitHub Flow・並列サブエージェント安全規約を明文化。

---

## 2. 実行検証結果（検証）

| 検証項目 | 実行コマンド | 結果 | 詳細 |
| :--- | :--- | :--- | :--- |
| **シークレットスキャン** | `node scripts/securityCheck.js` | **PASS** | 73 ファイル検査・漏洩パターンおよび禁止ファイル検出ゼロ |
| **ドキュメント整合性** | `node scripts/docCheck.js` | **PASS** | 必須ドキュメント・全 7 件の ADR インデックス登録確認済 |
| **OpenAPI 型同期** | `npm run sync-api` | **PASS** | `schema.d.ts` 自動出力完了 (35.9ms) |
| **フロントエンド型検査** | `npm --prefix frontend run type-check` | **PASS** | TypeScript Strict モード エラー 0 件 |
| **フロントエンド単体テスト** | `npm --prefix frontend run test:run` | **PASS** | Vitest 6/6 テスト全件合格 |
| **フロントエンドビルド** | `npm --prefix frontend run build` | **PASS** | Vite 本番バンドル & PWA `sw.js` 生成完了 |
| **バックエンドテスト** | `.\mvnw.cmd test` | **PASS** | 8/8 テスト全件合格 (Repository, Controller, Health, 楽観ロック, 世帯分離) |
| **Single JAR パッケージング** | `.\mvnw.cmd clean package -DskipTests` | **PASS** | React PWA を static に内包した実行可能 JAR 生成完了 (30s) |
| **ワンショット品質ゲート** | `npm run check` | **PASS** | 全検査が一発でパス |
