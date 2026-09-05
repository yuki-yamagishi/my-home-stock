---
name: dev-harness
description: Spring Boot 4 + React PWA + PostgreSQL 向け AI駆動開発ハーネス、AIアシスト Issue/PR 連携、ADR設計決定記録、4軸事前検証、品質・セキュリティゲート、OpenAPI型同期、完全日本語ドキュメント標準化スキル。新規機能開発・改修時に必ず使用する。
---

# MyHomeStock AI駆動開発・検証ハーネス スキル

このスキルは、**Spring Boot 4 + React + TypeScript + PWA + PostgreSQL** アプリケーションにおいて、**「AIアシスト Issue/PR + ADR + OpenAPI型同期 + ワンショット品質ゲート」** を用いて最高品質の開発・検証・PR作成を行うための公式ワークフローガイドです。

---

## 1. 開発フロー（標準ハイブリッド 4 ステップ）

```
[ 1. AIアシスト Issue 起票 ] ───> [ 2. ADR 作成 (必要時) ] ───> [ 3. ブランチ & 実装 ] ───> [ 4. PR作成 & CIパス ]
  (gh issue または URL)            (docs/adr/000X-...)           (feature/issue-X-...)        (npm run check / GitHub Actions)
```

---

## 2. ドキュメント & ADR 運用ルール (`docs/` 配下)

すべての設計・検証資産はリポジトリの `docs/` 配下に完全な日本語で記録・保守します：

1. **設計決定記録 (`docs/adr/`)**:
   - アーキテクチャ変更や技術選定の理由・トレードオフを番号付き不変レコードで蓄積。
   - `docs/adr/README.md` に必ず登録する。
2. **事前検証ログ (`docs/pre_phase_verification.md`)**:
   - 4つの検証軸（①技術的ボトルネック, ②UX・エッジケース, ③データ永続性・互換性, ④テスト自律性）を評価。
3. **実装計画書 (`docs/implementation_plan.md`)**:
   - 変更ファイル一覧、実装内容、検証手順を簡潔に記載。
4. **実装成果レポート (`docs/walkthrough.md`)**:
   - フェーズ完了時に達成内容、検証結果、コミット/PR情報を記録。

---

## 3. ワンショット品質 & セキュリティゲート

変更後は必ず以下のコマンドで全件合格を確認します：

```bash
npm run check
```

**実行される自動検査**:
1. **シークレットスキャン (`node scripts/securityCheck.js`)**: APIキー・トークン・秘密鍵・禁止 `.env` ファイルの誤混入を自動検知。
2. **ドキュメント整合性検査 (`node scripts/docCheck.js`)**: `docs/` 配下の必須ファイルの存在・内容充実度および ADR インデックスを検証。
3. **TypeScript 型検査 (`npm --prefix frontend run type-check`)**: Strict モードでの型完全性の検証。
4. **単体・UIテスト (`npm --prefix frontend run test:run`)**: コアロジックの単体テスト検証。
5. **本番バンドルビルド (`npm --prefix frontend run build`)**: Vite プロダクションビルドおよび PWA Service Worker / Manifest 生成検証。

バックエンド側のテスト検証は以下で実行します：
```bash
cd backend && .\mvnw.cmd test
```

---

## 4. OpenAPI 型同期

バックエンドの API コントローラーや DTO を修正した場合は、必ず以下を実行してフロントエンド型を同期してください：
```bash
npm run sync-api
```

---

## 5. Git コミット & PR 規約

* **ブランチ命名**: `feature/issue-<番号>-<概要>`, `fix/issue-<番号>-<概要>`
* **Conventional Commits 形式**:
  - `feat:` 新機能追加
  - `fix:` バグ修正
  - `docs:` ドキュメント・ADR 作成・更新
  - `chore:` ハーネス・設定更新
  - `test:` テスト追加・修正
* **PR 本文への Issue 紐付け**: `Closes #<Issue番号>` を必ず含める。
* **言語標準**: すべてのドキュメント・解説・PR本文は **完全日本語** で記述。
