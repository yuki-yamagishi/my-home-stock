# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-015

- **対象Issue**: ISSUE-015: antigravity-review-loop 自動更新 GitHub Actions ワークフローの導入
- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **作成日**: 2026-09-18

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **アップストリーム非干渉と完全自律 Pull 型アーキテクチャ**:
  - `antigravity-review-loop` は他プロジェクトでも広く利用される共通基盤であるため、特定の下流向け通知（`repository_dispatch`）や PAT の設定をアップストリームに求めない。
  - 下流リポジトリ（MyHomeStock）側の GitHub Actions が、6 時間間隔（`schedule` cron: `0 */6 * * *`）および手動実行（`workflow_dispatch`）で自律的にポーリングする。
  - GitHub 公式の Dependabot（`gitsubmodule`）も併設し、多重防衛で更新漏れをゼロにする。
- **Git Submodule 追跡**:
  - `git submodule update --remote --merge .agents/plugins/antigravity-review-loop` を確実に実行するため、`.gitmodules` に `branch = main` を明記する。
- **PR 作成アクション**:
  - `peter-evans/create-pull-request@v7` を使用し、ワークフロー内で品質ゲート・型検査・単体テストを事前実行した上で PR を作成する。
  - トークンは標準の `GITHUB_TOKEN` のみを使用し、PAT の発行・管理を完全に不要とする。

### 1.2. UX・運用・エッジケース
- **自動マージの禁止と人間の確認**:
  - Submodule 更新による意図しない破壊を防ぐため、直接 `main` への push ではなく PR 作成に留め、人間が最終確認・マージを行う。
  - ワークフロー内で事前テスト（`qualityGateRunner.js`, `type-check`, `test:run`）を全件実行するため、万一壊れたコミットがあっても PR 起票前にワークフローが赤色停止し、安全性が担保される。
- **更新がない場合の挙動 (No-op)**:
  - リモートに差分がない場合、`create-pull-request` アクションはコミットや PR 作成を行わず安全に終了する。

### 1.3. データ永続性・互換性
- **4ドキュメント構造・ADR との整合**:
  - `docs/issues/ISSUE-015_.../` に 4 ドキュメントを配置し、`docs/adr/0013-automated-submodule-update-workflow.md` に設計決定を記録。
  - 相手側リポジトリには一切変更を加えないため、アップストリームおよび他プロジェクトへの互換性影響はゼロ。

### 1.4. テスト自律性
- **完全自律検証**:
  - ローカル環境で `npm run check` によるフル検証が可能。
  - ワークフロー内でも同一の品質ゲート・型検査・テストが自動実行される。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **既存ワークフロー (`.github/workflows/ci.yml`, `deploy.yml`)**:
  - `ci.yml` は push / pull_request で品質検証を実行する。
  - `deploy.yml` は main への push で OCI 向けコンテナビルドを実行する。
  - 新設する `update-review-loop-submodule.yml` はサブモジュールの自律 Pull 更新に特化し、責務が明確に分離されている。
- **アップストリーム（antigravity-review-loop）の独立性**:
  - アップストリーム側へのコード追加や設定追加を完全に 0 件とすることで、共通基盤としての純粋性を保全し、パッチワーク化を根絶する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- 自作の複雑な API 連携や Webhook サーバーを作らず、GitHub 標準の Actions スケジューラおよび Dependabot の標準プリミティブを活用して宣言的・保守性の高い構成とする。
