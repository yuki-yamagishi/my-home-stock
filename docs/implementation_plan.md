# 実装計画書 (Implementation Plan)

> [!NOTE]
> 本ファイルは常に最新の進行中フェーズの実装計画書を保持します。
> 個別の Issue 計画書は `docs/issues/` 配下の各 Issue フォルダに完全に保全されています。

## 現在進行中: Issue #1 (開発ハーネスおよびCI/CD・品質ガバナンス・独立レビュー機構のセットアップ)
詳細は [docs/issues/ISSUE-001_dev_harness_setup/plan.md](./issues/ISSUE-001_dev_harness_setup/plan.md) を参照。

### 変更予定ファイル一覧
- `docs/issues/ISSUE-001_dev_harness_setup/` (4ドキュメント完備)
- `scripts/checkers/adrChecker.js` (新規)
- `scripts/checkers/agentSkillChecker.js` (新規)
- `scripts/checkers/issueDocChecker.js` (新規)
- `scripts/docCheck.js` (オーケストレーター化へ改修)
- `.agents/subagents/fleet-reviewer/subagent.json` (新規)
- `.agents/subagents/fleet-reviewer/SYSTEM_PROMPT.md` (新規)
- `.githooks/pre-commit` (新規)
- `.githooks/pre-push` (新規)
- `.github/PULL_REQUEST_TEMPLATE.md` (新規)
- `.github/ISSUE_TEMPLATE/` (新規)
- `docs/adr/0003-development-harness-and-quality-governance.md` (新規)
- `docs/adr/README.md` (更新)
- `package.json` (更新)

### 検証手順
- `node scripts/docCheck.js`
- `node scripts/securityCheck.js`
- `npm run check`
