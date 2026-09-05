# 実装計画書 (Implementation Plan)

## 1. 概要
本計画書は、**MyHomeStock**（フロント・バックエンド完全分離型PWA/BFF、Spring Boot 3 + React + TypeScript + PostgreSQL 16）向けAI駆動開発ハーネスの構築手順と構成管理を記録する計画書です。

---

## 2. 変更内容一覧（変更）

### ① ガバナンス・規約・AIスキル
- `AGENTS.md`: AIエージェントおよび人間開発者向けの詳細規約、クリーンアーキテクチャ境界、Issue/PRライフサイクル管理、並列サブエージェント安全規約。
- `.agents/skills/dev-harness/SKILL.md`: 開発ハーネススキル定義。
- `.github/workflows/ci.yml`: GitHub Actions 自動品質検査 CI。
- `.github/ISSUE_TEMPLATE/` & `PULL_REQUEST_TEMPLATE.md`: テンプレート。

### ② ドキュメント & ADR (`docs/`)
- `docs/architecture.md`: システム全体アーキテクチャ設計書。
- `docs/adr/`: ADR-0001 から ADR-0005 までの設計決定記録とインデックス README。
- `docs/pre_phase_verification.md`: 4軸事前検証ログ。
- `docs/walkthrough.md`: 成果レポート。
- `docs/openapi.json`: OpenAPI 3.0 仕様書ベースライン。

### ③ 自動検査 & API型同期スクリプト (`scripts/`, `package.json`)
- `scripts/securityCheck.js`: クレデンシャル・シークレット・禁止 `.env` スキャナー。
- `scripts/docCheck.js`: 必須ドキュメント整合性・ADRインデックス検証。
- `scripts/syncApi.js`: OpenAPI 3.0 -> TypeScript 型自動同期。
- `package.json`: ルート `npm run check` 等の統合タスク定義。

### ④ バックエンド (`backend/`)
- Spring Boot 3.4.x / Java 21 / Maven Wrapper (`mvnw`, `mvnw.cmd`)。
- JPA エンティティ `StockItem`（`@Version` による楽観的排他制御）。
- Flyway マイグレーション `V1__init_schema.sql`。
- SpringDoc OpenAPI Swagger UI エンドポイント (`/swagger-ui.html`)。
- H2 による `@DataJpaTest` および `@WebMvcTest` 自動テスト。

### ⑤ フロントエンド (`frontend/`)
- React 18 + Vite 5 + TypeScript (Strict) + Tailwind CSS + Radix UI + Lucide。
- `vite-plugin-pwa` による PWA オフラインキャッシュ、Manifest 生成。
- `src/core/stockStatus.ts`: 純粋ビジネスロジック層と Vitest 単体テスト。
- `src/api/`: OpenAPI 自動生成型 `schema.d.ts` と `client.ts`。
- TanStack Query フックによるキャッシュ・楽観的更新。

---

## 3. 検証計画（検証）

1. **シークレットスキャン**: `node scripts/securityCheck.js` が PASS すること。
2. **ドキュメント整合性**: `node scripts/docCheck.js` が PASS すること。
3. **OpenAPI 型同期**: `node scripts/syncApi.js` で `frontend/src/api/schema.d.ts` が正常生成されること。
4. **フロントエンド検証**:
   - `npm --prefix frontend run type-check` (型エラーゼロ)
   - `npm --prefix frontend run test:run` (Vitest 全件合格)
   - `npm --prefix frontend run build` (PWA SW/Manifest 出力確認)
5. **バックエンド検証**:
   - `./mvnw.cmd test` (H2 DB テスト全件合格、楽観的排他制御インクリメント検証)
6. **総合品質ゲート**:
   - ルートで `npm run check` を実行し、全項目が一発で PASS すること。
