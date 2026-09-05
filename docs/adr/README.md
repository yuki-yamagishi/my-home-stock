# Architecture Decision Records (ADR) 一覧

本ディレクトリは、**MyHomeStock** における重要なアーキテクチャ設計・技術選定の決定理由とトレードオフを不変の履歴ログとして管理します。
新しい意思決定を行う際は、`0000-template.md` を複製して新規レコードを作成し、本テーブルに必ず登録してください。

| 番号 | タイトル | ステータス | 決定日 |
| :--- | :--- | :--- | :--- |
| **[ADR-0001](0001-bff-rest-api-architecture.md)** | フロントエンド／バックエンド完全分離型 BFF/API アーキテクチャの採用 | 承認済 | 2026-09-05 |
| **[ADR-0002](0002-pwa-mobile-offline-first.md)** | vite-plugin-pwa によるモバイル PWA およびオフラインファースト戦略 | 承認済 | 2026-09-05 |
| **[ADR-0003](0003-spring-boot-jpa-optimistic-locking.md)** | Spring Data JPA と @Version による楽観的排他制御 (Optimistic Locking) | 承認済 | 2026-09-05 |
| **[ADR-0004](0004-openapi-typescript-schema-sync.md)** | SpringDoc OpenAPI 3.0 と openapi-typescript による型自動同期 | 承認済 | 2026-09-05 |
| **[ADR-0005](0005-docker-local-db-and-cloud-deploy.md)** | Docker によるローカル PostgreSQL 環境と OCI / Cloudflare デプロイ | 承認済 | 2026-09-05 |
| **[ADR-0006](0006-upgrade-to-spring-boot-4.md)** | Spring Initializr 公式仕様に基づく Spring Boot 4 系への全面移行 | 承認済 | 2026-09-05 |
| **[ADR-0007](0007-consolidated-oci-single-jar.md)** | OCI統合単一コンテナ/Single JARアーキテクチャへの移行および世帯マルチテナント基盤の導入 | 承認済 | 2026-09-05 |
| **[ADR-0008](0008-development-harness-and-quality-governance.md)** | 4ドキュメントIssue管理・モジュール式チェッカー・独立AIレビューによる開発ガバナンスハーネスの導入 | 承認済 | 2026-09-06 |

---

## ADR 運用ルール
1. **不変性**: 一度承認・マージされた ADR は書き換えず、仕様変更時は新たな ADR で上書き（Supercede）します。
2. **完全日本語標準**: 背景、決定、影響はすべて完全な日本語で記述します。
3. **自動検証**: `npm run doc-check` (`scripts/docCheck.js`) により、新規 ADR ファイルが本テーブルに登録されているか機械的に検証されます。
