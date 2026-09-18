# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-015

- **対象Issue**: ISSUE-015: antigravity-review-loop 自動更新 GitHub Actions ワークフローの導入
- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **作成日**: 2026-09-18

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **GitHub Actions トリガー制約**:
  - `repository_dispatch` イベントは、外部リポジトリ（アップストリーム）から GitHub REST API 経由で発火されるため、呼び出し側に親リポジトリへの書き込み権限（Fine-grained PAT または Classic PAT）が必要。
  - PAT なしでも動作するフォールバックとして、手動トリガー（`workflow_dispatch`）および定期実行（`schedule` cron）を同一ワークフロー内に併設する。
- **Git Submodule 追跡**:
  - `git submodule update --remote --merge .agents/plugins/antigravity-review-loop` を確実に実行するため、`.gitmodules` に `branch = main` を明示する。
- **PR 作成アクション**:
  - `peter-evans/create-pull-request@v7` を使用し、既存のブランチをクリーンに更新して PR を作成する。
  - リポジトリ権限として `contents: write`, `pull-requests: write` を workflow に付与する。

### 1.2. UX・運用・エッジケース
- **自動マージの禁止と人間の確認**:
  - Submodule 更新による意図しない破壊（フック仕様の変更等）を防ぐため、直接 `main` への push ではなく PR 作成に留める。
  - PR が作成されると、既存の `ci.yml`（Java テスト、TypeScript 型検査、Vitest、ドキュメント整合性）が自動実行され、CI の成否が PR 画面で一目瞭然となる。
- **更新がない場合の挙動 (No-op)**:
  - リモートに差分がない場合、`create-pull-request` アクションはコミットや PR 作成を行わず安全に終了する。

### 1.3. データ永続性・互換性
- **4ドキュメント構造・ADR との整合**:
  - `docs/issues/ISSUE-015_.../` に 4 ドキュメントを配置し、`docs/adr/0013-automated-submodule-update-workflow.md` を作成して記録する。
  - 既存のプラグイン構成（`.agents/plugins/myhomestock/` および `.agents/plugins/antigravity-review-loop/`）の構造を破壊しない。

### 1.4. テスト自律性
- **ローカルおよび CI による完全自律検証**:
  - ローカル環境で `git submodule update --remote` の挙動を確認可能。
  - `qualityGateRunner.js` により、サブモジュール更新後もプラグイン展開・ドキュメント整合性・シークレット検査がパスすることをワンショットで検証可能。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **既存ワークフロー (`.github/workflows/ci.yml`, `deploy.yml`)**:
  - `ci.yml` は push / pull_request で品質検証（Java / Frontend）を実行する。
  - `deploy.yml` は main への push で OCI 向けコンテナビルドを実行する。
  - 今回新設する `update-review-loop-submodule.yml` は、サブモジュールの更新検知と PR 作成に特化した独立ワークフローであり、既存の CI/CD ワークフローと責務が完全に分離されている。
- **既存スクリプト・フック**:
  - `.agents/plugins/myhomestock/hooks/pluginDeploymentGuard.js` はサブモジュールの存在と必須ファイルを検証している。
  - 新ワークフロー内でもこのガードを直接呼び出して事前検証を行うため、既存のガバナンス機構と緊密に協調する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- 自作の複雑な API スクリプトやシェルスクリプトを親リポジトリに散らかさず、デファクトスタンダードである `peter-evans/create-pull-request` および GitHub 標準の `repository_dispatch` を活用して宣言的・保守性の高いワークフローとして定義する。
