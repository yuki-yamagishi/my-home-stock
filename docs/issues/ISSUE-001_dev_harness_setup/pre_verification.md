# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-001

- **対象Issue**: ISSUE-001: 開発ハーネスおよびCI/CD・品質ガバナンス・独立レビュー機構のセットアップ
- **実施日**: 2026-09-06
- **担当**: Lead AI Developer & Harness Architect

---

## 1. 4軸事前検証サマリー

### 軸1: 事前検証 & 技術的ボトルネック (Technical Feasibility)
- **Git Hooks の実行環境**:
  - Windows 環境では PowerShell と Git Bash (MSYS2 `sh`) が混在するため、`.githooks/pre-push` での標準入力読み込み時に `read local_ref local_sha remote_ref remote_sha` が空または予期しない改行コードでエラーになるリスクを特定。`cat > /dev/null` や標準入力の空読み処理を施したスクリプトを採用する。
- **チェッカーのモジュール分割**:
  - モノリシックな `docCheck.js` から `scripts/checkers/` 配下に `issueDocChecker.js`、`adrChecker.js`、`agentSkillChecker.js` を分離。
  - `package.json` の `"type": "module"` に対応し、ES Modules 形式（`import`/`export`）で統一。
- **Fleet Reviewer の最小権限設計**:
  - レビュアーサブエージェントがコードを編集・コミットしてしまう事故を防ぐため、システムプロンプトおよび設定で「書き込み禁止」「ウォッチモード厳禁（`npm run test:run` のみ）」「PRコメント投稿のみ」を強制。

### 軸2: 開発者体験 & UX (Developer Experience)
- **トークン消費と読み込み速度の大幅改善**:
  - Issue ごとに独立したフォルダ（`docs/issues/ISSUE-XXX/`）で 4 ドキュメント（`issue.md`, `pre_verification.md`, `plan.md`, `walkthrough.md`）を完結させることで、エージェントや開発者が一度に参照するファイルサイズを最小限に抑え、コンテキスト溢れやトークン消費を抑制。
- **Conventional Comments によるレビュー負荷軽減**:
  - PR レビュー時に `[must]`, `[should]`, `[imo]`, `[nits]`, `[ask]` の接頭辞をルール化することで、人間レビュアーが「どこがブロッカーで、どこが提案なのか」を一目で判断可能にする。

### 軸3: データ永続性 & アーキテクチャ整合性 (Data & Architectural Integrity)
- **過去ログ・決定記録の完全保全**:
  - 各 Issue の完了後も検証ログやウォークスルーが上書きされずに残り続けるため、将来のデバッグや機能追加時に「なぜその設計にしたのか」を過去 Issue から即座にトレース可能。
- **ADR-0003 の策定**:
  - ハーネスとガバナンスの設計決定を `docs/adr/0003-development-harness-and-quality-governance.md` に記録し、プロジェクト全体で恒久的に遵守する規約とする。

### 軸4: テスト自律性 & ガードレール (Automated Guardrails)
- **多層防御のチェック体制**:
  1. `pre-commit`: 秘密情報スキャン ＋ ドキュメント整合性
  2. `pre-push`: 静的型検査 ＋ 単体テスト ＋ ビルド
  3. `Fleet Reviewer`: PR 差分レビュー ＋ Conventional Comments 出力
  4. CI/CD (GitHub Actions): リモートビルド ＋ テスト自動実行
- **ワンショットコマンド**:
  - `npm.cmd run check` 1 コマンドで全検査を一括実行可能。
