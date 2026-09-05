---
name: dev-harness
description: Spring Boot 4 + Vue 3 PWA + PostgreSQL 向け AI駆動開発ハーネス、4ドキュメントIssue管理、Conventional Commits / Conventional Comments、Fleet 独立レビュー、ADR設計決定記録、ワンショット品質ゲート (npm run check) スキル。
---

# MyHomeStock AI駆動開発・検証ハーネス スキル

このスキルは、**Spring Boot 4 + Vue 3 + TypeScript + PWA + PostgreSQL** アプリケーションにおいて、**「Issue 4ドキュメント管理 + ADR + ワンショット品質ゲート (npm run check) + 独立レビューサブエージェント (Fleet)」** を用いて最高品質の開発・検証・PR作成を行うための公式ワークフローガイドです。

---

## 1. 開発フロー（標準ハイブリッド 6 ステップ）

```
[ 1. Issue 起票 & docs/ 記録 ] ───> [ 2. ADR 作成 (必要時) ] ───> [ 3. ブランチ & 実装 ]
  (docs/issues/ISSUE-XXX/)              (docs/adr/000X-...)           (feature/issue-X-...)
           │
           ▼
[ 4. ワンショット品質ゲート通過 ] ───> [ 5. PR作成 & Fleet レビュー ] ───> [ 6. 人間承認マージ ]
  (npm run check / Git Hooks)            (Conventional Comments)             (gh pr merge)
```

---

## 2. ドキュメント & Issue 運用ルール (`docs/` 配下)

すべての設計・検証資産はリポジトリの `docs/` 配下に完全な日本語で記録・保守します：

1. **Issue ライフサイクル管理 (`docs/issues/ISSUE-XXX/`)**:
   - 各 Issue はフォルダ化し、以下の 4 ドキュメントでライフサイクルを完結させます：
     - `issue.md`: 要件定義、背景、受け入れ基準
     - `pre_verification.md`: 4軸事前検証ログ
     - `plan.md`: 実装計画・変更対象ファイル一覧
     - `walkthrough.md`: 実装成果レポート・検証ログ
   - ルート `docs/`（`pre_phase_verification.md`, `implementation_plan.md`, `walkthrough.md`）には最新 Issue へのポインタを維持。
2. **設計決定記録 (`docs/adr/`)**:
   - アーキテクチャ変更や技術選定の理由・トレードオフを不変レコードとして蓄積。
   - `docs/adr/README.md` に必ず登録する。

---

## 3. コミット & レビュー規約

1. **Conventional Commits 規約**:
   - コミットメッセージには必ず `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:` 等の接頭辞を付与する。
2. **独立レビューサブエージェント (Fleet)**:
   - PR 作成後は `.agents/subagents/fleet-reviewer/` を呼び出し、客観的な第三者コードレビューを実施。
   - Conventional Comments（`[must]`, `[should]`, `[imo]`, `[nits]`, `[ask]`）で指摘し、`[LGTM]` または `[要修正]` を判定。

---

## 4. ワンショット品質ゲート (npm run check)

コミット前・プッシュ前には必ず以下のコマンドで全件合格を確認します：

```bash
npm run check
```

**実行される自動検査**:
1. **シークレットスキャン (`node scripts/securityCheck.js`)**: APIキー・トークン・秘密鍵の誤混入を自動検知。
2. **ドキュメント整合性検査 (`node scripts/docCheck.js`)**: `docs/issues/` の 4 ドキュメント完結性、ルートポインタ、ADR、エージェント定義を検証。
3. **TypeScript 型検査 (`npm --prefix frontend run type-check`)**: Strict モードでの型完全性を検証。
4. **単体・UIテスト (`npm --prefix frontend run test:run`)**: コアロジックの単体テスト検証。
5. **本番バンドルビルド (`npm --prefix frontend run build`)**: Vite プロダクションビルドおよび PWA Service Worker / Manifest 生成検証。

バックエンド側のテスト検証：
```bash
.\mvnw.cmd test
```
