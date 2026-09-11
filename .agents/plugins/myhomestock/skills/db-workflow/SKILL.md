---
name: db-workflow
description: >-
  PostgreSQL 16 ローカルコンテナの起動・停止・ログ確認および Flyway マイグレーション運用を行う Runbook。
  データベースの初期化、スキーマ変更、テスト用 DB 接続トラブルシューティング時に使用する。
---

# データベース運用 & Flyway マイグレーション Runbook (db-workflow)

このスキルは、**MyHomeStock** における Docker PostgreSQL 16 コンテナの起動・停止・ログ監視および Flyway SQL マイグレーションの実行手順を定めます。

---

## 1. コンテナ運用コマンド

1. **PostgreSQL コンテナの起動 (バックグラウンド)**:
   ```bash
   npm run db:up
   ```
   - `docker compose up -d postgres` が実行され、ポート 5432 で起動します。

2. **コンテナログの監視**:
   ```bash
   npm run db:logs
   ```

3. **コンテナの停止**:
   ```bash
   npm run db:down
   ```

---

## 2. Flyway マイグレーション規約

- マイグレーションファイル配置先: `src/main/resources/db/migration/`
- 命名規約: `V<バージョン>__<説明>.sql`（例: `V1__create_stock_items.sql`）
- **必須カラム**:
  - `household_id VARCHAR(50) NOT NULL`（世帯マルチテナント分離）
  - `version BIGINT NOT NULL DEFAULT 0`（JPA 楽観的排他制御）
  - `created_at TIMESTAMP WITH TIME ZONE NOT NULL`
  - `updated_at TIMESTAMP WITH TIME ZONE NOT NULL`

---

## 3. テスト環境との分離

- 単体・統合テスト（`mvnw.cmd test`）実行時は、`src/test/resources/application-test.yml` に定義された **H2 インメモリ DB** が自動使用されるため、Docker の起動は不要です。
