# ISSUE-001: 開発ハーネスおよびCI/CD・品質ガバナンス・独立レビュー機構のセットアップ

- **ステータス**: 🟡 進行中 (`status: in_progress`)
- **優先度**: 最高 (Critical / Foundation)
- **カテゴリ**: `type: harness`, 開発基盤, ガバナンス, CI/CD, 自動化
- **対象プラットフォーム**: Spring Boot 4 (Java 21) / React 18 (Vite, Tailwind CSS, TanStack Query) / Antigravity Agent / Git

---

## 1. 概要 (Overview)

自律型AIエージェントおよび人間開発者による MyHomeStock プロジェクトの開発サイクル（要件定義 〜 事前検証 〜 実装 〜 テスト 〜 コミット 〜 プッシュ 〜 PR 〜 独立AIレビュー 〜 人間承認マージ）を、極めて高品質かつ安全に自律遂行できるようにするため、**堅牢な開発ハーネス・品質自動ガード機構・独立レビューエージェント** をセットアップします。

先行リポジトリ（`job-eval`）で実証されたベストプラクティスをベースに、MyHomeStock の **Spring Boot 4 (Java 21, Maven) + React 18 (Vite, Tailwind CSS, TanStack Query)** ハイブリッド構成に最適化した設計・実装を行います。

---

## 2. 背景と目的 (Background & Motivation)

### 課題
1. **ドキュメントの肥大化と過去ログ喪失リスク**:
   - 単一の Markdown ファイルで全フェーズの検証ログや実装計画を管理すると、ファイルサイズが肥大化してトークンを浪費し、最新の作業で過去の設計決定や検証エビデンスが上書き・喪失する。
2. **実装者バイアスによる品質低下**:
   - 実装を担当したエージェント自身がレビューを行うと、不要なファイル変更やセキュリティ脆弱性、テスト漏れを見落としやすい。
3. **ローカル検証漏れによるブロークンコードのプッシュ**:
   - コミット時やプッシュ時のガードがないと、型エラー、テスト失敗、秘密情報（APIキー等）が誤ってコミット・プッシュされるリスクがある。
4. **レビュー基準・PR運用の属人化**:
   - PRテンプレートや重要度接頭辞（Conventional Comments）が未定義だと、人間レビュアーの負担が増大し、確認ポイントが曖昧になる。

### 目的
- **4ドキュメント・フォルダ完結型 Issue 構造** により、各機能の仕様・事前検証・計画・成果レポートを完全保全する。
- **Fleet Reviewer Subagent** を新設し、客観的第三者による自動コードレビューを確立する。
- **共有 Git Hooks (`.githooks/`)** により、セキュリティ・ドキュメント・テスト・ビルドの不合格コードの混入を物理的に阻止する。
- **モジュール式チェッカー (`scripts/checkers/`)** により、Java と React/TypeScript の両方を包括した一括検証（`npm run check`）を実現する。
- **PR / Issue テンプレート** により、GitHub 上での開発・レビュー体験を標準化する。

---

## 3. 要件定義 (Requirements)

### ① Issue フォルダ完結型ライフサイクル管理
- `docs/issues/ISSUE-XXX_<title>/` 配下に以下の 4 ドキュメントを必須化：
  - `issue.md`: 要件定義、背景、受け入れ基準
  - `pre_verification.md`: 4軸事前検証ログ（技術的制約、UX、データ永続性、テスト自律性）
  - `plan.md`: 実装計画、変更対象ファイル、検証手順
  - `walkthrough.md`: 成果レポート、動作検証結果、変更サマリー
- ルート `docs/`（`pre_phase_verification.md`, `implementation_plan.md`, `walkthrough.md`）は常に「最新進行中 Issue へのポインタ」として維持。
- `docs/issues/README.md` で全 Issue のステータスを可視化。

### ② AI 独立レビューサブエージェント (Fleet Reviewer)
- `.agents/subagents/fleet-reviewer/` 配下に `subagent.json` および `SYSTEM_PROMPT.md` を作成。
- 最小権限原則（ファイル変更・コミット・プッシュ禁止、対話型ウォッチモード禁止、読み取り・テスト実行・PRコメント投稿のみ許可）。
- Conventional Comments（`[must]`, `[should]`, `[imo]`, `[nits]`, `[ask]`）と判定（`[LGTM]` / `[要修正]`）の強制。

### ③ 共有 Git Hooks (`.githooks/`)
- `.githooks/pre-commit`:
  - `node scripts/securityCheck.js`: 秘密情報・APIキー・クレデンシャル混入検知
  - `node scripts/docCheck.js`: ドキュメント・Issue整合性検証
- `.githooks/pre-push`:
  - `npm.cmd run check`（または Linux `npm run check`）を実行。
  - Windows 環境での標準入力（stdin）構文エラーに対応した堅牢なシェルスクリプト。
- `npm run prepare`: `git config core.hooksPath .githooks` を自動実行。

### ④ モジュール式チェッカー群 (`scripts/checkers/`)
- `scripts/checkers/issueDocChecker.js`:
  - `docs/issues/ISSUE-XXX/` フォルダの存在、各ドキュメントの存在・文字数チェック。
  - ルートポインタの文字数・参照先チェック。
- `scripts/checkers/adrChecker.js`:
  - `docs/adr/` の採番・ステータス・`docs/adr/README.md` との同期チェック。
- `scripts/checkers/agentSkillChecker.js`:
  - エージェント定義（`.agents/subagents/`）の完全性チェック。
- `scripts/securityCheck.js`:
  - パスワード、APIキー、トークン、秘密鍵等のパターンマッチ検知。
- `scripts/docCheck.js`:
  - 各チェッカーを統括する軽量オーケストレーター。

### ⑤ GitHub テンプレート (`.github/`)
- `.github/PULL_REQUEST_TEMPLATE.md`:
  - 関連 Issue、4ドキュメントへのリンク、ローカル検証チェックリスト、Conventional Comments凡例、自動マージ禁止の明記。
- `.github/ISSUE_TEMPLATE/`:
  - `feature_request.md` (機能追加)
  - `bug_report.md` (バグ報告)
  - `refactor_task.md` (リファクタリング)

### ⑥ npm scripts & プロジェクト連携
- `npm run check`: シークレット + ドキュメント + 型検査 + テスト + ビルドの一括実行。
- `package.json` のスクリプト整備。

---

## 4. 受け入れ基準 (Acceptance Criteria)

- [ ] `docs/issues/ISSUE-001_dev_harness_setup/` 配下に 4 ドキュメントが配備されていること。
- [ ] GitHub Issue #1 が作成されていること。
- [ ] `.agents/subagents/fleet-reviewer/` が作成され、`subagent.json` と `SYSTEM_PROMPT.md` が配備されていること。
- [ ] `.githooks/pre-commit` および `.githooks/pre-push` が配備され、実行権限・動作が確認されていること。
- [ ] `scripts/checkers/` 配下のチェッカー群（`issueDocChecker.js`, `adrChecker.js`, `agentSkillChecker.js`）および `scripts/docCheck.js`, `scripts/securityCheck.js` が正常動作すること。
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` および `.github/ISSUE_TEMPLATE/` が作成されていること。
- [ ] `npm run check` が 100% PASS すること。
- [ ] 本 Issue に対応する設計決定記録 `docs/adr/0003-development-harness-and-quality-governance.md` が作成されていること。

---

## 5. 技術的論点 / 設計考慮事項 (Technical Notes)

- **Spring Boot 4 (Maven) と React 18 (npm) の統合検証**:
  - `npm run check` において、フロントエンドの型検査・テスト・ビルドだけでなく、バックエンドのテスト（`mvnw test`）もスムーズに実行できる構成を担保する。
- **Windows PowerShell と Git Bash の互換性**:
  - Git Hooks は Git for Windows の `sh` で動作するため、`npm.cmd` の呼び出しや stdin の空読み等、Windows 環境特有のハング・構文エラーを防止する。
