# 実装成果レポート (Walkthrough) - ISSUE-006

- **対象Issue**: ISSUE-006: antigravity-review-loop プラグインの Git Submodule 導入および重複機能の整理
- **ステータス**: 🟢 完了・合議承認済 (`status: completed`)
- **作成日**: 2026-09-11

---

## 1. 成果サマリー

1. **Composable Plugins Architecture への完全昇華 (AGY ベストプラクティス準拠)**:
   - **汎用ガバナンスプラグイン (`antigravity-review-loop`)**:
     - `https://github.com/yuki-yamagishi/antigravity-review-loop.git` を Git Submodule としてマウント（**プラグイン内部コード無修正の厳守**）。
     - 汎用フック（DoR, DoD, Safety, Stop）、汎用スキル（`issue-lifecycle`, `dev-lifecycle`, `review-self-healing`）、汎用合議エージェント（`fleet_reviewer`, `fleet_completion_auditor`, `fleet_dor_auditor`）を提供。
   - **MyHomeStock 専用プラグイン (`myhomestock`)**:
     - `.agents/plugins/myhomestock/` を新設し、プロジェクト固有の関心事をカプセル化。
     - **専用 Rules (`rules/domain-constraints.md`)**: JPA `@Version` 楽観排他、`household_id` 世帯分離、`src/core/` 純粋コアロジック不可侵を常時自動ロード。
     - **専用 Hooks (`hooks.json` & `hooks/openapiSyncGuard.js`)**: コミット・PR作成時の OpenAPI 仕様と TypeScript 型の同期を物理ガード（乖離時に `deny`）。
     - **専用 Subagent (`agents/stock_domain_auditor.md`)**: 4 大ドメイン原則の遵守を批判的・客観的に専門監査する第三者サブエージェント。
     - **専用 Skills (`skills/sync-api/`, `skills/db-workflow/`)**: OpenAPI 型自動同期および Docker PostgreSQL 運用 Runbook をオンデマンド提供。
2. **ルート `scripts/` の完全撤廃と AGY プリミティブへの構造的リファクタリング**:
   - ルートに存在していた `scripts/` ディレクトリ（8ファイル）を完全削除。
   - スクリプトが担っていた関心事を AGY 公式プリミティブへと再設計：
     - **Hooks (`hooks/`)**: `qualityGateRunner.js`, `secretLeakGuard.js`, `pluginDeploymentGuard.js`, `docIntegrityGuard.js`, `openapiSyncGuard.js` へ集約。
     - **Skills (`skills/*/scripts/`)**: `sync-api/scripts/sync.js`, `issue-workflow/scripts/switch.js` へ内包。
   - `package.json`, `.github/workflows/ci.yml`, `.githooks/pre-commit` がプラグイン内部の Hooks を直接利用する構成に一元化。
3. **不要なメタチェッカーの完全撤廃**:
   - `scripts/checkers/agentSkillChecker.js` を削除し、Antigravity ネイティブのプラグイン機構に委譲。「テストのためのテスト」という保守負債を完全根絶。
4. **MyHomeStock 側の旧重複機能の完全削除**:
   - 旧ハーネススキル（`.agents/skills/dev-harness/`）および旧サブエージェント（`.agents/subagents/fleet-reviewer/`）を完全削除。
5. **ADR-0009 策定および AGENTS.md のスリム化**:
   - ドメイン制約の詳細をプラグイン `rules/` に移譲し、リポジトリ全体のエントリーポイントとして整備。

---

## 2. 検証結果

- [x] Git Submodule 正常登録 (`git submodule status`)
- [x] プラグイン無修正確認 (`git -C .agents/plugins/antigravity-review-loop status` が clean)
- [x] 専用プラグイン完全配備 (`.agents/plugins/myhomestock/` の plugin.json, rules, hooks, skills, agents)
- [x] ルート `scripts/` 完全撤廃 (0ファイル化・完全クリーン)
- [x] プラグイン Hooks 統合ランナー (`qualityGateRunner.js`) の動作確認
- [x] GitHub Actions CI (`.github/workflows/ci.yml`) における `qualityGateRunner.js` 直接実行
- [x] `npm.cmd run check` 全件 PASS:
  - プラグイン Guards (PASS: Secrets, Submodule Deployment, ADR & Issue 4-Doc, OpenAPI Sync)
  - TypeScript 型検査 (PASS)
  - Vitest 単体テスト (PASS)
  - Vite + PWA プロダクションビルド (PASS)

---

## 3. レビュー指摘事項と改善対応履歴 (Review Feedback & Iterations)

| 重要度 | 指摘・改善提案 | 対応内容 | 反映ファイル |
| :--- | :--- | :--- | :--- |
| `[must]` | プラグイン内部のコード修正の絶対禁止 | `.agents/plugins/antigravity-review-loop` のファイルは一切変更せず、MyHomeStock 側のスクリプト・設定のみを適合させた | 全体 |
| `[must]` | 重複機能の完全削除 | 旧 `dev-harness` スキルおよび旧 `fleet-reviewer` サブエージェントを `git rm` で削除し、プラグイン公式機能に一本化した | `.agents/` |
| `[must]` | AGY ベストプラクティスに基づく専用プラグイン化 | `.agents/plugins/myhomestock/` を新設し、専用 Hook（`openapi-sync-guard`）、専用 Subagent（`stock_domain_auditor`）、専用 Rules（`domain-constraints.md`）、専用 Skills（`sync-api`, `db-workflow`）を体系的に配備した | `.agents/plugins/myhomestock/` |
| `[must]` | Submodule 未展開リスクの物理封じ込め (Fleet監査指摘) | 空ディレクトリによるサイレントバイパスを防ぐため、`pluginDeploymentGuard.js` を配備して `qualityGateRunner.js` に統合。未初期化時はエラー案内とともに即時ブロック | `pluginDeploymentGuard.js`, `qualityGateRunner.js` |
| `[must]` | ルート scripts/ の完全撤廃と構造的リファクタリング (ユーザー指摘) | `scripts/` をプラグインへ無理やり移設するのではなく、AGY の公式プリミティブ（Hooks/Skills）へと構造から再設計。`scripts/` を完全撤廃し、Hooks (`hooks/`) と Skills (`skills/*/scripts/`) に昇華させた | `hooks/`, `skills/`, ルート `scripts/` (削除) |
| `[should]` | GitHub Actions CI における Submodule チェックアウト漏れ (Fleet監査指摘) | CI 環境で Submodule が空となり検査落ちするリスクを防ぐため、`.github/workflows/ci.yml` の各ジョブに `submodules: recursive` を追加 | `.github/workflows/ci.yml` |
| `[should]` | ルールとスキルの責務分離 (Rules vs Skills) | 常時制約（JPA楽観排他、世帯分離等）を `rules/` に、オンデマンド手順（型同期等）を `skills/` に厳格に分離した | `.agents/plugins/myhomestock/rules/`, `skills/` |
| `[must]` | スクリプト内相対パス解決の脆弱性 (Fleetレビュー指摘) | `sync.js` と `switch.js` で親ディレクトリを走査して `package.json` と `.git` を特定する動的探索関数 `findProjectRoot()` を導入し、実行ディレクトリや階層移動に頑健な構造へ改善 | `sync.js`, `switch.js` |
| `[must]` | frontend/package.json の旧スクリプト参照残骸 (Fleetレビュー指摘) | `scripts/generate-api-client.js` を参照していた `sync-api` スクリプトを `../.agents/plugins/myhomestock/skills/sync-api/scripts/sync.js` へ更新し、Root / Frontend 双方での単体実行を検証 | `frontend/package.json` |
| `[nits]` | ドキュメント内の旧スクリプト参照残骸 (Fleetレビュー指摘) | `README.md` および `docs/adr/README.md` 内の旧 `scripts/` 記述をプラグイン配下の新パスへ統一 | `README.md`, `docs/adr/README.md` |



