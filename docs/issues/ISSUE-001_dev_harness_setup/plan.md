# 実装計画書 (Implementation Plan) - ISSUE-001

- **対象Issue**: ISSUE-001: 開発ハーネスおよびCI/CD・品質ガバナンス・独立レビュー機構のセットアップ
- **ステータス**: 🟡 進行中 (`status: in_progress`)
- **作成日**: 2026-09-06

---

## 1. 変更ファイル一覧

### 新規作成
- `docs/issues/ISSUE-001_dev_harness_setup/`
  - `issue.md`
  - `pre_verification.md`
  - `plan.md`
  - `walkthrough.md`
- `scripts/checkers/`
  - `scripts/checkers/issueDocChecker.js` (Issueフォルダ・必須ドキュメント整合性チェッカー)
  - `scripts/checkers/adrChecker.js` (ADR採番・README同期チェッカー)
  - `scripts/checkers/agentSkillChecker.js` (エージェント定義チェッカー)
- `.agents/subagents/fleet-reviewer/`
  - `subagent.json` (Fleet Reviewer サブエージェント設定)
  - `SYSTEM_PROMPT.md` (独立レビュープロンプト & 権限規約)
- `.githooks/`
  - `pre-commit` (シークレットスキャン + ドキュメント整合性)
  - `pre-push` (型チェック + テスト + ビルド)
- `.github/`
  - `PULL_REQUEST_TEMPLATE.md` (PR テンプレート)
  - `ISSUE_TEMPLATE/feature_request.md` (機能要望テンプレート)
  - `ISSUE_TEMPLATE/bug_report.md` (バグ報告テンプレート)
  - `ISSUE_TEMPLATE/refactor_task.md` (リファクタリングテンプレート)
- `docs/adr/0003-development-harness-and-quality-governance.md` (ADR-0003: 開発ハーネスと品質ガバナンス設計)

### 変更 / 再編
- `scripts/docCheck.js` (モノリシックから `scripts/checkers/` オーケストレーターへ刷新)
- `docs/pre_phase_verification.md` (ルートポインタ更新)
- `docs/implementation_plan.md` (ルートポインタ更新)
- `docs/walkthrough.md` (ルートポインタ更新)
- `docs/issues/README.md` (Issue-001 の追加と後続 Issue のロードマップ再編)
- `docs/adr/README.md` (ADR-0003 の追記)
- `package.json` (`prepare` スクリプト等を追加)

---

## 2. 実装ステップ

### Step 1: Issue 構造の確立と GitHub Issue の作成
- `docs/issues/ISSUE-001_dev_harness_setup/` の 4 ドキュメント作成。
- `gh issue create` で GitHub Issue #1 を作成し、ローカルとリモートのナンバリングを同期。
- `docs/issues/` の既存ファイルを再編（ISSUE-002 以降へ整理）。

### Step 2: モジュール式チェッカー群の配備 (`scripts/checkers/`)
- `issueDocChecker.js`, `adrChecker.js`, `agentSkillChecker.js` を作成。
- `docCheck.js` をこれらを呼び出すオーケストレーターにリファクタリング。
- `node scripts/docCheck.js` で動作確認。

### Step 3: Git Hooks の配備と自動設定 (`.githooks/`)
- `.githooks/pre-commit` と `.githooks/pre-push` を作成。
- 実行権限を付与し、`git config core.hooksPath .githooks` を設定。
- `package.json` に `"prepare": "git config core.hooksPath .githooks"` を追加。

### Step 4: Fleet Reviewer サブエージェントの配備 (`.agents/subagents/fleet-reviewer/`)
- `subagent.json`（読み取り・テスト実行権限のみ）を作成。
- `SYSTEM_PROMPT.md`（Conventional Comments・単発テスト実行・PRコメント自動投稿）を作成。

### Step 5: GitHub PR / Issue テンプレートの配備 (`.github/`)
- `PULL_REQUEST_TEMPLATE.md`、`ISSUE_TEMPLATE/` 3種を作成。

### Step 6: ADR-0003 策定 & 全体验証
- `docs/adr/0003-development-harness-and-quality-governance.md` を作成し、`docs/adr/README.md` に登録。
- `npm run check` を実行し、全項目 PASS を確認。

---

## 3. 検証計画

### 自動テスト & チェッカー
```bash
# 1. ドキュメント整合性チェッカー
node scripts/docCheck.js

# 2. セキュリティ・シークレットスキャン
node scripts/securityCheck.js

# 3. フロントエンド型検査・テスト・ビルド
npm --prefix frontend run type-check
npm --prefix frontend run test:run
npm --prefix frontend run build

# 4. バックエンド単体テスト
./mvnw.cmd test

# 5. ワンショット一括検査
npm run check
```
