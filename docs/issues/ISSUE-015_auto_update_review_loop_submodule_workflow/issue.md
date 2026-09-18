# ISSUE-015: antigravity-review-loop 自動更新 GitHub Actions ワークフローの導入

- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **優先度**: 高 (High / Automation & Governance)
- **カテゴリ**: `type: ci`, GitHub Actions, Git Submodule, ガバナンス自動化
- **対象**: `.github/workflows/update-review-loop-submodule.yml`, `.github/dependabot.yml`, `.gitmodules`, `docs/adr/0013-automated-submodule-update-workflow.md`

---

## 1. 概要 (Overview)

`antigravity-review-loop`（https://github.com/yuki-yamagishi/antigravity-review-loop）が修正・更新された際に、親リポジトリ（MyHomeStock）が相手リポジトリに一切の変更・設定（PATや通知ワークフロー）を要求することなく、完全自律 Pull 型（定期ポーリング＋手動実行＋Dependabot）で最新コミットを取得し、品質ゲート検証を経た上で Pull Request を自動起票する GitHub Actions ワークフローを導入します。

---

## 2. 解決すべき課題・背景 (Why)

1. **手動更新への依存による滞留リスク**:
   - `antigravity-review-loop` はフック機構や品質ガバナンスを司る共通サブモジュールである。
   - アップストリーム側でセキュリティ修正や機能強化（例: PR #2 の curl タイムアウトガードや branch DoR 検証強化）が行われても、親リポジトリ側の同期が手作業に依存しており、更新漏れや古いバージョンへの滞留が生じる。
2. **精神論の排除と物理的自動化 (Mechanisms do)**:
   - 「気づいたら更新する」「こまめに `git submodule update` を叩く」という精神論（Good intentions）を排除し、GitHub Actions による自律的定期ポーリングおよび Dependabot の二重網によって、常に最新のガバナンス基盤を維持する物理的仕組み（Mechanism）を構築する。
3. **アップストリーム非干渉・疎結合の原則**:
   - `antigravity-review-loop` は多数のプロジェクトで利用される汎用基盤であるため、特定の下流プロジェクト（MyHomeStock）宛ての通知設定やトークンをアップストリームに埋め込む密結合アンチパターンを徹底排除し、下流側が自律して Pull する境界設計を貫く。

---

## 3. 排除するリスク (Risks to Eliminate)

1. **破壊的変更の無検証直接反映リスクの排除**:
   - サブモジュールの変更を親リポジトリの `main` ブランチに直接 push すると、既存のビルドやテストが破損する危険がある。
   - **対策**: GitHub Actions が専用ブランチ（`chore/update-antigravity-review-loop`）にコミットして Pull Request を自動作成し、さらに PR 作成前に同一ワークフロー内で品質ゲート・厳格型検査・単体テストを全件実行して安全性を事前保証する。
2. **アップストリーム汚染・密結合リスクの排除**:
   - アップストリーム側に特定の下流宛て Webhook や PAT を持たせると、下流の増加に伴いアップストリームの保守が破綻する。
   - **対策**: アップストリームには 1 行の変更も求めず（設定 0 件）、MyHomeStock 側が主体となって 6 時間ごとの定期実行（`schedule` cron）および手動実行（`workflow_dispatch`）で自律的に Pull する。
3. **認証情報の漏洩・失効リスクの排除**:
   - 個人トークン（PAT）を発行・管理すると、有効期限切れで自動化が停止する脆弱性がある。
   - **対策**: PAT を一切使用せず、GitHub Actions 標準の `GITHUB_TOKEN` のみで自己完結させる。

---

## 4. 機能受け入れシナリオ (Given-When-Then)

### シナリオ 1: 完全自律 Pull 型ワークフロー定義の完全性
- **Given**: MyHomeStock リポジトリの `.github/workflows/` ディレクトリにおいて
- **When**: `update-review-loop-submodule.yml` の定義を検査したとき
- **Then**: `workflow_dispatch`（手動実行）および `schedule`（cron）がトリガーとして設定され、相手リポジトリへの通知要求（`repository_dispatch`）が存在せず、事前テスト（`qualityGateRunner.js`, `type-check`, `test:run`）および `peter-evans/create-pull-request` による PR 作成ステップが定義されていること。

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
- [x] `.github/workflows/update-review-loop-submodule.yml` が作成され、完全自律 Pull 型（schedule, workflow_dispatch）と事前品質テストおよび PR 自動作成処理が実装されていること。
- [x] `.github/dependabot.yml` が配備され、Git Submodule の日次更新追跡が有効化されていること。
- [x] `.gitmodules` に `branch = main` が設定されていること。
- [x] サブモジュール `.agents/plugins/antigravity-review-loop` が最新コミット（`65aa8b9`）に同期されていること。
- [x] 設計決定記録 `docs/adr/0013-automated-submodule-update-workflow.md` が作成され、`docs/adr/README.md` に登録されていること。
- [x] アップストリームへの密結合な依存（相手側ワークフローや PAT 設定）が一切存在しないこと。
- [x] 本 Issue の 4 ドキュメント（`issue.md`, `pre_verification.md`, `plan.md`, `walkthrough.md`）が完備されていること。
- [x] `npm.cmd run check` が 100% PASS すること。

### 5.2. マージ前プロセス完了基準 (Pre-Merge DoD)
- [ ] 3者 Fleet レビュー合議（`fleet_reviewer` + `fleet_completion_auditor` + `stock_domain_auditor`）の全者 LGTM 達成。
- [ ] 人間開発者（ユーザー）による最終確認とマージ実行。
