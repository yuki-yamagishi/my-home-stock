---
name: sync-api
description: >-
  SpringDoc OpenAPI 3.0 仕様書 (docs/openapi.json) から TypeScript 型定義 (frontend/src/api/schema.d.ts) を自動同期・再生成し、型検査を実行するワークフロー Runbook。
  バックエンドの REST Controller や Request/Response DTO を追加・変更した際、またはフロントエンドの API クライアントを更新する際に使用する。
---

# OpenAPI スキーマ & TypeScript 型同期 Runbook (sync-api)

このスキルは、**MyHomeStock** において Spring Boot 4 バックエンドの REST API 定義と React 18 フロントエンドの TypeScript 型定義を 100% 同期するための公式実行手順です。

---

## 1. 概要 & 発動契機

- **発動契機**:
  - バックエンド側で DTO や Controller を変更・追加したとき。
  - `docs/openapi.json` を更新したとき。
  - `openapi-sync-guard` フックまたは `npm run check` で型同期エラーが検知されたとき。
- **目的**:
  - バックエンドとフロントエンド間の「型の不整合による実行時エラー」をコンパイル時・静的検査時に 100% 排除する。

---

## 2. 実行手順

1. **型同期スクリプトの実行**:
   ```bash
   npm run sync-api
   ```
   - スキル付属スクリプト `scripts/sync.js` が実行され、`docs/openapi.json` を元に `openapi-typescript` が `frontend/src/api/schema.d.ts` を自動生成します。

2. **フロントエンド型チェックの即時確認**:
   ```bash
   npm.cmd run check:fast
   ```
   - 生成された新しい型に対して、フロントエンドのクライアント呼び出し（`client.ts`）やカスタムフック（`useStockItems` 等）で型エラーがないか確認します。

3. **型エラー修正時の注意点**:
   - `frontend/src/api/schema.d.ts` を手動で直接編集してはならない（再生成で上書きされるため）。
   - 型エラーがある場合は、フロントエンドの呼び出し側コード、またはバックエンドの DTO 定義側を修正すること。

4. **コミット**:
   - `docs/openapi.json` と `frontend/src/api/schema.d.ts` をペアでステージングしてコミットします。
