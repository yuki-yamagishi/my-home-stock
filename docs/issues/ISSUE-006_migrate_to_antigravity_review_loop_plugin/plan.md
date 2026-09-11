# 実装計画書 (Implementation Plan) - ISSUE-006

- **対象Issue**: ISSUE-006: antigravity-review-loop プラグインの Git Submodule 導入および重複機能の整理
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-11

---

## 1. 変更ファイル一覧

### 新規追加
- `.gitmodules`: Git Submodule 設定ファイル
- `.agents/plugins/antigravity-review-loop`: 公式プラグイン Submodule
- `.agents/plugins/myhomestock`: MyHomeStock 専用プラグイン
  - `hooks/qualityGateRunner.js`: CI/npm check 統合ランナー
  - `hooks/secretLeakGuard.js`: シークレット漏洩物理ガード
  - `hooks/pluginDeploymentGuard.js`: プラグイン & Submodule 展開物理ガード
  - `hooks/docIntegrityGuard.js`: ADR & Issue 4ドキュメント整合性物理ガード
  - `hooks/openapiSyncGuard.js`: OpenAPI 型同期物理ガード
  - `skills/sync-api/scripts/sync.js`: 型同期自動化スクリプト
  - `skills/issue-workflow/`: Issue ライフサイクル切り替え Runbook & スクリプト
- `docs/adr/0009-adopt-antigravity-review-loop-plugin.md`: 設計決定記録
- `docs/issues/ISSUE-006_migrate_to_antigravity_review_loop_plugin/`: Issue 4ドキュメント完備

### 削除
- `scripts/` ディレクトリ配下の全ファイル（完全撤廃）:
  - `scripts/checkers/adrChecker.js`
  - `scripts/checkers/issueDocChecker.js`
  - `scripts/checkers/openapiSyncChecker.js`
  - `scripts/checkers/pluginChecker.js`
  - `scripts/docCheck.js`
  - `scripts/securityCheck.js`
  - `scripts/syncApi.js`
  - `scripts/issueSwitch.js`
- `.agents/skills/dev-harness/`: プラグイン重複
- `.agents/subagents/fleet-reviewer/`: プラグイン重複

### 変更
- `.github/workflows/ci.yml`: `qualityGateRunner.js` 実行および `submodules: recursive`
- `.githooks/pre-commit`: プラグイン `qualityGateRunner.js` 実行
- `package.json`: プラグイン Hooks / Skills を直接指す構成に更新
- `AGENTS.md`: プラグイン構成・合議制レビュー・物理フック仕様の反映
- `docs/adr/README.md`: ADR-0009 の目次登録
- `docs/issues/README.md`: ISSUE-006 の登録
- ルートポインタ（`pre_phase_verification.md`, `implementation_plan.md`, `walkthrough.md`）

---

## 2. 実装ステップ

1. **Git Submodule 登録**:
   - `antigravity-review-loop` を Submodule マウント（内部無修正厳守）。
2. **重複ファイル削除**:
   - 旧 `dev-harness` および旧 `fleet-reviewer` を削除。
3. **AGY プリミティブへの構造的リファクタリング**:
   - ルート `scripts/` の全関心事を、プラグインの `hooks/`（物理ガード群）および `skills/*/scripts/`（作業自動化スクリプト）へ再編。
   - `scripts/` ディレクトリを完全削除。
4. **設定・CI・Git Hooks の更新**:
   - `package.json`, `.github/workflows/ci.yml`, `.githooks/pre-commit` を更新。
5. **ガバナンス・ADR・Issue 更新**:
   - `AGENTS.md`, ADR-0009, Issue 4ドキュメントを同期。
6. **品質ゲート検証**:
   - `npm.cmd run check` 全件 PASS を確認。
