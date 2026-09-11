# [ADR-0009] antigravity-review-loop 公式プラグインの導入 (Git Submodule) と重複ハーネス機能の一元化

* **ステータス**: 承認済
* **日付**: 2026-09-11
* **決定者**: プロジェクトオーナー, 開発チーム

---

## 1. 文脈と問題提起 (Context)

ADR-0008 により、MyHomeStock プロジェクトでは 4 ドキュメント Issue 管理・モジュール式チェッカー・独立レビューサブエージェント（Fleet）による開発ガバナンスハーネスを導入した。
しかし、ハーネスの各種スクリプト、スキル定義（`.agents/skills/dev-harness/SKILL.md`）、サブエージェント設定（`.agents/subagents/fleet-reviewer/`）をプロジェクト内に個別にベタ書き・手動保守していたため、以下の課題が生じていた：

1. **二重保守とパッチワーク化のリスク**:
   - プラグイン `antigravity-review-loop` で進化している高度な機能（ブランチ前の DoR 監査、PR 作成前の 4 ドキュメント・DoD 完了ゲート、2者合議制レビューコンソーシアム、自己修復ループステートマシン等）を個別に追従・実装しようとすると、コード重複や仕様乖離のリスクが生じる。
2. **物理的仕組み化（Mechanisms do）の強化要請**:
   - 単にチェッカーを実行するだけでなく、エージェントのツール呼び出し時（`git checkout -b`, `gh pr create`, `gh pr merge`, セッション終了 `Stop`）に直接フックを仕掛けて逸脱を物理的に阻止するライフサイクルフック（Lifecycle Hooks）の必要性。

---

## 2. 決定内容 (Decision)

AGY（Antigravity）公式仕様の **Composable Plugins Architecture** に準拠し、「汎用ガバナンス基盤」と「MyHomeStock ドメイン専用プラグイン」の 2 枚構成としてハーネスを根本再編する：

1. **汎用プラグインの Git Submodule 導入**:
   - `.agents/plugins/antigravity-review-loop`（https://github.com/yuki-yamagishi/antigravity-review-loop）を Submodule としてマウント。
   - **プラグイン側のコード修正は絶対に禁止（無修正の厳守）**。
   - 汎用ライフサイクルフック（DoR, DoD, Safety, Stop）、汎用スキル（`issue-lifecycle`, `dev-lifecycle`, `review-self-healing`）、汎用合議エージェント（`fleet_reviewer`, `fleet_completion_auditor`, `fleet_dor_auditor`）を提供。
2. **MyHomeStock 専用プラグイン（`.agents/plugins/myhomestock/`）の創設**:
   - **専用 Rules (`rules/domain-constraints.md`)**:
     - JPA `@Version` 楽観的排他制御、`household_id` 世帯マルチテナント分離、`src/core/` 純粋コアロジック不可侵、OpenAPI 3.0 型安全バインドを不変則として常時ロード。
   - **専用 Hooks (`hooks.json` & `hooks/openapiSyncGuard.js`)**:
     - コミット時や PR 作成時に OpenAPI スキーマと TypeScript 型定義（`schema.d.ts`）の整合性を検証し、乖離時に物理ブロック（`deny`）するメカニズム。
   - **専用 Subagent (`agents/stock_domain_auditor.md`)**:
     - PR レビュー合議制において、MyHomeStock の 4 大ドメイン原則の遵守を批判的・客観的に専門監査する第三者サブエージェント。
   - **専用 Skills (`skills/sync-api/`, `skills/db-workflow/`)**:
     - OpenAPI 型自動同期手順および Docker PostgreSQL 16 運用 Runbook をオンデマンド提供。
3. **ルート `scripts/` の完全撤廃と AGY プリミティブ（Hooks / Skills）への構造的リファクタリング**:
   - 旧来の「ルートの `scripts/` に雑多な検証・運用スクリプトを置く」慣習を完全根絶。
   - スクリプトが担っていた関心事を AGY の公式プリミティブ（Rules, Skills, Hooks）に適合するよう構造からリファクタリング：
     - **Hooks (`hooks/`)**: 静的検証・物理ガード・CI統合ランナー（`qualityGateRunner.js`, `secretLeakGuard.js`, `pluginDeploymentGuard.js`, `docIntegrityGuard.js`, `openapiSyncGuard.js`）へ集約。
     - **Skills (`skills/*/scripts/`)**: 作業手順と付属自動化スクリプト（`sync-api/scripts/sync.js`, `issue-workflow/scripts/switch.js`）へ内包。
   - これにより、プロジェクトルートの `scripts/` ディレクトリそのものを完全撤廃（0ファイル化）。CI や Git Hooks、`package.json` はプラグインの Hooks を直接利用する形に統一。

---

## 3. 結果・影響 (Consequences)

### プラスの影響 (Positive)
- **AGY ベストプラクティスへの完全準拠**: プラグインが「Rules, Skills, Hooks, Agents」から成る完全自己完結したバンドル（Self-Contained Bundle）となり、ルートに露出していた実装負債が全廃。
- **二重管理の根絶**: `hooks/` と `scripts/checkers/` で重複していた検証ロジックが 1 本化され、エージェント・CI・開発者で同一のガードを共有。
- **物理ガードと専門合議の極大化**: `openapi-sync-guard` や `qualityGateRunner.js` による物理遮断、および `stock_domain_auditor` によるドメイン整合性監査が機能し、精神論を完全排除。
- **リポジトリの極度なクリーン化**: プロジェクトルートに `scripts/` が存在せず、ソースコード・ドキュメント・プラグインのクリーンな 3 層構造を実現。

### トレードオフ・留意点 (Neutral / Negative)
- 初回クローン時に `--recurse-submodules` または `git submodule update --init --recursive` の実行が必要。
