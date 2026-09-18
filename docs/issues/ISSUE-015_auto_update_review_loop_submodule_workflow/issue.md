# ISSUE-015: antigravity-review-loop 自動更新 GitHub Actions ワークフローの導入

- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **優先度**: 高 (High / Automation & Governance)
- **カテゴリ**: `type: ci`, GitHub Actions, Git Submodule, ガバナンス自動化
- **対象**: `.github/workflows/update-review-loop-submodule.yml`, `.gitmodules`, `docs/adr/0013-automated-submodule-update-workflow.md`

---

## 1. 概要 (Overview)

`antigravity-review-loop`（https://github.com/yuki-yamagishi/antigravity-review-loop）が修正・更新された際に、親リポジトリ（MyHomeStock）が自動的に最新コミットを取得し、品質ゲート検証を経た上で Pull Request を自動起票する GitHub Actions ワークフローを導入します。
さらに、`antigravity-review-loop` 側からプッシュ時に即時通知するための連携設定手順書および ADR を整備します。

---

## 2. 解決すべき課題・背景 (Why)

1. **手動更新への依存による滞留リスク**:
   - `antigravity-review-loop` はフック機構や品質ガバナンスを司る共通サブモジュールである。
   - アップストリーム側でセキュリティ修正や機能強化（例: PR #2 の curl タイムアウトガードや branch DoR 検証強化）が行われても、親リポジトリ側の同期が手作業に依存しており、更新漏れや古いバージョンへの滞留が生じる。
2. **精神論の排除と物理的自動化 (Mechanisms do)**:
   - 「気づいたら更新する」「こまめに `git submodule update` を叩く」という精神論（Good intentions）を排除し、GitHub Actions によるイベント駆動および定期ポーリングの二重網によって、常に最新のガバナンス基盤を維持する物理的仕組み（Mechanism）を構築する。

---

## 3. 排除するリスク (Risks to Eliminate)

1. **破壊的変更の無検証直接反映リスクの排除**:
   - サブモジュールの変更を親リポジトリの `main` ブランチに直接 push すると、既存のビルドやテストが破損する危険がある。
   - **対策**: GitHub Actions が専用ブランチ（`chore/update-antigravity-review-loop`）にコミットして Pull Request を自動作成し、既存 CI（Java テスト、TypeScript 型検査、Vitest、ドキュメント整合性）による自動検証を通過した上で人間がマージするフローを強制する（グローバル憲章 2.3「人間マージ専権」の遵守）。
2. **イベント不達・トークン失効による同期停止リスクの排除**:
   - `repository_dispatch` のみに頼ると、トークン有効期限切れやネットワークエラー時に同期が停止する。
   - **対策**: `repository_dispatch`（即時連動）、`workflow_dispatch`（手動即時実行）、`schedule`（毎日の定期 cron ポーリング）の 3 系統のトリガーを完備する。
3. **認証情報の漏洩リスクの排除**:
   - 過剰な権限を持つトークンの漏洩を防ぐため、最小権限（Contents 権限のみ）の Fine-grained PAT 設定ガイドを提供し、GitHub Secrets による保護を徹底する。

---

## 4. 機能受け入れシナリオ (Given-When-Then)

### シナリオ 1: GitHub Actions ワークフロー定義の完全性
- **Given**: MyHomeStock リポジトリの `.github/workflows/` ディレクトリにおいて
- **When**: `update-review-loop-submodule.yml` の定義を検査したとき
- **Then**: `repository_dispatch`（`update-review-loop`, `submodule-update`）、`workflow_dispatch`、`schedule`（cron）がトリガーとして設定され、`peter-evans/create-pull-request` による PR 作成ステップが定義されていること。

### シナリオ 2: Git Submodule 追跡設定の明示化
- **Given**: プロジェクトルートの `.gitmodules` ファイルにおいて
- **When**: 設定内容を検査したとき
- **Then**: `.agents/plugins/antigravity-review-loop` に対して `branch = main` が明記されており、`git submodule update --remote` で確実に最新コミットを追跡可能であること。

### シナリオ 3: 最新コミットのローカル取り込みと品質ゲート通過
- **Given**: サブモジュールをリモートの最新コミット（`65aa8b9`）に更新した状態で
- **When**: `npm.cmd run check` を実行したとき
- **Then**: プラグイン展開ガード、ドキュメント整合性ガード、シークレット漏洩スキャン、型検査、単体テスト、ビルドが 100% 成功すること。

---

## 5. 受け入れ基準 / Definition of Done (DoD)

### 5.1. PR作成前プロセス完了基準 (Pre-PR Process DoD)
- [x] `.github/workflows/update-review-loop-submodule.yml` が作成され、トリガー（repository_dispatch, workflow_dispatch, schedule）と PR 自動作成処理が実装されていること。
- [x] `.gitmodules` に `branch = main` が設定されていること。
- [x] サブモジュール `.agents/plugins/antigravity-review-loop` が最新コミット（`65aa8b9`）に同期されていること。
- [x] 設計決定記録 `docs/adr/0013-automated-submodule-update-workflow.md` が作成され、`docs/adr/README.md` に登録されていること。
- [x] アップストリーム側の通知ワークフロー設定手順書 `docs/guides/review_loop_submodule_sync_setup.md` が作成されていること。
- [x] 本 Issue の 4 ドキュメント（`issue.md`, `pre_verification.md`, `plan.md`, `walkthrough.md`）が完備されていること。
- [x] `npm.cmd run check` が 100% PASS すること。

### 5.2. マージ前プロセス完了基準 (Pre-Merge DoD)
- [ ] 3者 Fleet レビュー合議（`fleet_reviewer` + `fleet_completion_auditor` + `stock_domain_auditor`）の全者 LGTM 達成。
- [ ] 人間開発者（ユーザー）による最終確認とマージ実行。
