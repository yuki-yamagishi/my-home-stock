# Issue / タスク一覧 (Task Governance)

本ディレクトリは、**MyHomeStock** における開発課題・機能要望・改善タスクをリポジトリ内でバージョン管理（Git-Tracked）し、AI エージェントと開発者がオフライン環境でも自律的・整合的にタスクを管理するためのインデックスです。

新しいタスクを追加・起票する際は、`0000-template.md` を複製して `ISSUE-XXX_タイトル.md` を作成し、本テーブルに必ず登録してください。

---

## 📋 Issue 一覧

| Issue 番号 | タイトル | ステータス | 種別 | 担当者 | 作成日 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[ISSUE-001](ISSUE-001_stock_items_crud_ui.md)** | 在庫アイテム一覧・登録・編集・削除 UI の実装 | 🔵 `status: ready` | 🟢 `feature` | AIエージェント | 2026-09-06 |
| **[ISSUE-002](ISSUE-002_shopping_list_and_shortage_view.md)** | 買い物リスト自動生成 & 補充完了トグル機能の実装 | 🟠 `status: todo` | 🟢 `feature` | 未定 | 2026-09-06 |
| **[ISSUE-003](ISSUE-003_pwa_barcode_scanner.md)** | PWA カメラによる JAN コード / バーコード読み取り機能の導入 | 🟡 `status: backlog` | 🟢 `feature` | 未定 | 2026-09-06 |
| **[ISSUE-004](ISSUE-004_household_sharing_sync.md)** | 家族間マルチデバイス共有と世帯切り替え UI の実装 | 🟡 `status: backlog` | 🟢 `feature` | 未定 | 2026-09-06 |

---

## 🚦 Issue ライフサイクル規定 (AGENTS.md 準拠)

AI エージェントは、本テーブルおよび各 Issue 内の **ステータスラベル** に基づいて自律的に行動を制御します：

| ステータス | 意味・フェーズ | AIエージェントの行動基準 |
| :--- | :--- | :--- |
| **🟡 `status: backlog`** | アイデア・将来構想 | **着手禁止**。ユーザーから明示的な指示があるまで待機。 |
| **🟠 `status: todo`** | 直近の実施候補 | 要件整理・設計対話を優先。 |
| **🔵 `status: ready`** | **着手準備完了 (Ready)** | **自律的にトピックブランチを作成し、実装を開始可能**。 |
| **🟣 `status: in-progress`** | 開発・実装中 | トピックブランチにて実装・テスト・コミットを進行。 |
| **✅ `status: closed`** | 完了 | PR マージおよび品質ゲート合格完了。 |

---

## 🛡️ 自動検証ルール
`scripts/docCheck.js` により、`docs/issues/` 配下の全 Issue ファイル（`0000-template.md` および `README.md` を除く）が本テーブルに登録されているか機械的に検証されます。
