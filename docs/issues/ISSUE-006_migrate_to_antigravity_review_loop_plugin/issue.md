# ISSUE-006: antigravity-review-loop プラグインの Git Submodule 導入および重複機能の整理

- **ステータス**: ✅ 完了 (`status: closed`)
- **優先度**: 最高 (Critical / Governance)
- **カテゴリ**: `type: harness`, プラグイン統合, 重複排除, 開発基盤, ガバナンス
- **対象**: Antigravity Plugin / Git Submodule / `.agents/` / `scripts/`

---

## 1. 概要 (Overview)

先行リポジトリ（`job-eval`）から個別コピー・手動保守されていた開発ハーネス（`.agents/skills/dev-harness/SKILL.md`）および単一レビューサブエージェント（`.agents/subagents/fleet-reviewer/`）を、公式プラグイン仕様に完全準拠した **`antigravity-review-loop`**（https://github.com/yuki-yamagishi/antigravity-review-loop）に移行します。
プラグインを Git Submodule として導入し、MyHomeStock 側に存在していた重複機能を完全に削除して一元化します。
ユーザー指示に基づき、**プラグイン側の修正は一切行わず（無修正の厳守）**、プロジェクト側のチェッカー・規約ドキュメントを適合させます。

---

## 2. 解決すべき課題・背景 (Why)

1. **個別手動保守によるパッチワーク化と機能乖離**:
   - プラグイン `antigravity-review-loop` で実装されている最新のガバナンス機構（DoR ゲート、Pre-PR DoD 完了ゲート、2者並行合議制レビューコンソーシアム、自己修復ループステートマシン等）がプロジェクト内の旧コードと乖離していた。
2. **多重管理による認知的負荷と保守コスト**:
   - スキル定義やエージェント設定がプロジェクト内とプラグインリポジトリで二重管理となり、どちらを更新すべきかの混乱を招いていた。

---

## 3. 排除するリスク (Risks to Eliminate)

1. **二重管理・パッチワークリスクの排除**:
   - 重複していた `.agents/skills/dev-harness/` および `.agents/subagents/fleet-reviewer/` を MyHomeStock から削除し、プラグイン公式機能に一本化する。
2. **プラグイン修正によるアップストリーム破壊リスクの完全排除**:
   - プラグイン側のコードには一切手を加えず、Git Submodule として純粋にマウントする。
3. **ルート `scripts/` の完全撤廃とプラグイン Hooks / Skills への構造的リファクタリング**:
   - ルートの `scripts/` に散らばっていたスクリプト群を完全撤廃（0ファイル化）し、AGY の公式プリミティブ（Hooks / Skills）へ構造的に再編・カプセル化する。

---

## 4. 機能受け入れシナリオ (Given-When-Then)

### シナリオ 1: Git Submodule 導入とプラグイン無修正の保証
- **Given**: プロジェクトルートにおいて
- **When**: `git submodule status` を実行したとき
- **Then**: `.agents/plugins/antigravity-review-loop` が正しく追跡されており、プラグインディレクトリ内の作業ツリーが clean（無修正）であること。

### シナリオ 2: MyHomeStock 側の重複機能の完全削除
- **Given**: リポジトリのファイルツリーにおいて
- **When**: 旧定義パスを検証したとき
- **Then**: `.agents/skills/dev-harness/` および `.agents/subagents/fleet-reviewer/` が完全に削除されていること。

### シナリオ 3: プラグイン Hooks ランナーによる品質ゲート全件合格
- **Given**: プラグイン Hooks への構造的リファクタリング完了後のコードベースにおいて
- **When**: `npm.cmd run check` を実行したとき
- **Then**: プラグイン Hooks（`qualityGateRunner.js` によるセキュリティ、プラグイン展開、ADR・Issue4ドキュメント、OpenAPI型同期の統合検証）、フロントエンド型検査、単体テスト、プロダクションビルドの全検査が 100% PASS すること。

---

## 5. 受け入れ基準 / Definition of Done (DoD)

### 5.1. PR作成前プロセス完了基準 (Pre-PR Process DoD)
- [x] `.agents/plugins/antigravity-review-loop` が Git Submodule として登録されていること。
- [x] プラグイン内部のコード・ファイルが一切修正されていないこと（無修正の厳守）。
- [x] `.agents/skills/dev-harness/` が削除されていること。
- [x] `.agents/subagents/fleet-reviewer/` が削除されていること。
- [x] ルートの `scripts/` ディレクトリを完全撤廃し、Hooks (`hooks/qualityGateRunner.js` 等) および Skills (`skills/sync-api/scripts/` 等) へ構造的にリファクタリングしていること。
- [x] CI ワークフロー (`.github/workflows/ci.yml`) において `submodules: recursive` が指定され、プラグインの `qualityGateRunner.js` を直接呼び出していること。
- [x] `package.json` に Inner Loop コマンド（`check:fast`, `check:docs`, `test:fast`, `test:related`）が追加され、プラグインを直接指定していること。
- [x] `AGENTS.md` がプラグインベースのガバナンス・合議制・物理フックに更新されていること。
- [x] 設計決定記録 `docs/adr/0009-adopt-antigravity-review-loop-plugin.md` が作成・登録されていること。
- [x] 本 Issue の 4 ドキュメントが完備されていること。
- [x] `npm.cmd run check` が 100% PASS すること。

### 5.2. マージ前プロセス完了基準 (Pre-Merge DoD)
- [x] 3者 Fleet レビュー（`fleet_reviewer` + `fleet_completion_auditor` + `stock_domain_auditor`）の合議受領（全者 LGTM 達成）。
- [ ] 人間開発者（ユーザー）による最終確認とマージ実行。

