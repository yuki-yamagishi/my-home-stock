# Issue / タスク一覧 (Task Governance)

本ディレクトリは、**MyHomeStock** における開発課題・機能要望・改善タスクをリポジトリ内でバージョン管理（Git-Tracked）し、AI エージェントと開発者が自律的・整合的にタスクを管理するためのインデックスです。

各 Issue は独立したフォルダ `ISSUE-XXX_<title>/` で管理され、ライフサイクルを通じて以下の 4 ドキュメントが維持されます：
1. `issue.md`: 要件定義、背景、受け入れ基準
2. `pre_verification.md`: 4軸事前検証ログ
3. `plan.md`: 実装計画・変更対象ファイル一覧
4. `walkthrough.md`: 成果レポート・動作検証ログ

---

## 📋 Issue 一覧

| Issue 番号 | タイトル | ステータス | 種別 | 担当者 | 作成日 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[ISSUE-001](ISSUE-001_dev_harness_setup/issue.md)** | 開発ハーネスおよびCI/CD・品質ガバナンス・独立レビュー機構のセットアップ | ✅ `status: closed` | 🛠️ `harness` | AIエージェント | 2026-09-06 |
| **[ISSUE-002](ISSUE-002_stock_items_crud_ui/issue.md)** | 在庫アイテム一覧・登録・編集・削除 UI の実装 | 🔵 `status: ready` | 🟢 `feature` | AIエージェント | 2026-09-06 |
| **[ISSUE-003](ISSUE-003_shopping_list_and_shortage_view/issue.md)** | 買い物リスト自動生成 & 補充完了トグル機能の実装 | 🟠 `status: todo` | 🟢 `feature` | 未定 | 2026-09-06 |
| **[ISSUE-004](ISSUE-004_pwa_barcode_scanner/issue.md)** | PWA カメラによる JAN コード / バーコード読み取り機能の導入 | 🟡 `status: backlog` | 🟢 `feature` | 未定 | 2026-09-06 |
| **[ISSUE-005](ISSUE-005_household_sharing_sync/issue.md)** | 家族間マルチデバイス共有と世帯切り替え UI の実装 | 🟡 `status: backlog` | 🟢 `feature` | 未定 | 2026-09-06 |
| **[ISSUE-006](ISSUE-006_migrate_to_antigravity_review_loop_plugin/issue.md)** | antigravity-review-loop プラグインの Git Submodule 導入および重複機能の整理 | ✅ `status: closed` | 🛠️ `harness` | AIエージェント | 2026-09-11 |
| **[ISSUE-007](ISSUE-007_google_oauth2_and_household_authorization/issue.md)** | Google OAuth2 認証とデータベース駆動型世帯管理および完全プライベートアクセスガードの導入 | ✅ `status: closed` | 🟢 `feature` | AIエージェント | 2026-09-14 |
| **[ISSUE-008](ISSUE-008_stock_detail_edit_and_input_ux_improvement/issue.md)** | 在庫詳細編集モーダル（EditStockModal）の実装と入力UI/UX改善 | ✅ `status: closed` | 🟢 `feature` | AIエージェント | 2026-09-14 |
| **[ISSUE-009](ISSUE-009_oci_continuous_deployment_pipeline/issue.md)** | OCI Always Free 向け GitHub Actions イミュータブル継続的デプロイ（CD）パイプラインの構築 | ✅ `status: closed` | 🚀 `ci` | AIエージェント | 2026-09-15 |
| **[ISSUE-010](ISSUE-010_remaining_level_stock_management/issue.md)** | 残量段階管理機能（4段階ステータス表示・消耗品管理）の実装 | ✅ `status: closed` | 🟢 `feature` | AIエージェント | 2026-09-16 |
| **[ISSUE-011](ISSUE-011_mobile_header_and_quick_add_ux_improvement/issue.md)** | スマートフォン向けUI/UX最適化（ヘッダー見切れ解消・ボトムナビ導入・在庫追加モーダル化） | 🟣 `status: in-progress` | 🟢 `feature` | AIエージェント | 2026-09-16 |

---

## 🚦 Issue ライフサイクル規定

| ステータス | 意味・フェーズ | AIエージェントの行動基準 |
| :--- | :--- | :--- |
| **🟡 `status: backlog`** | アイデア・将来構想 | **着手禁止**。ユーザーから明示的な指示があるまで待機。 |
| **🟠 `status: todo`** | 直近の実施候補 | 要件整理・設計対話を優先。 |
| **🔵 `status: ready`** | **着手準備完了 (Ready)** | **自律的にトピックブランチを作成し、実装を開始可能**。 |
| **🟣 `status: in-progress`** | 開発・実装中 | トピックブランチにて 4 ドキュメント更新、テスト、コミットを進行。 |
| **✅ `status: closed`** | 完了 | PR マージおよび品質ゲート合格完了。 |

---

## 🛡️ 自動検証ルール
`scripts/checkers/issueDocChecker.js` により、`docs/issues/` 配下の全 Issue フォルダの完全性（4ドキュメントの配備状況・文字数）および本テーブルとの整合性が機械的に検証されます。
