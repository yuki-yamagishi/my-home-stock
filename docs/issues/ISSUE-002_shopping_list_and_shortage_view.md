# [ISSUE-002] 買い物リスト自動生成 & 補充完了トグル機能の実装

* **ステータス**: 🟠 `status: todo`
* **種別**: 🟢 `type: feature`
* **担当者**: 未定
* **作成日**: 2026-09-06
* **関連 ADR / PR**: ADR-0003, ADR-0007

---

## 📌 課題の概要・背景 (Problem Description / Context)

在庫の数量が発注閾値（`minThreshold`）以下となった品目を自動的に「買い物リスト」として集約表示し、スーパーやドラッグストアでの買い物中にチェックを入れることで、在庫数量を補充（リセット）できるようにする。

---

## 🎯 要件定義 (Requirements)

1. **買い物リストタブ表示**:
   - `GET /api/v1/stocks/shopping-list` を呼び出し、補充が必要なアイテムのみを一覧化。
   - 不足数量（`minThreshold - quantity`）または推奨購入数を表示。
2. **購入完了（補充）アクション**:
   - チェックボックスまたはボタンをタップして「購入完了」にすると、在庫数量を適正値へ更新する。
3. **オフライン閲覧対応**:
   - PWA Service Worker キャッシュにより、電波の届きにくい地下スーパー等でも直前に読み込んだ買い物リストを表示可能にする。

---

## 🛠️ 技術設計・実装方針 (Technical Notes / Design)

- **フロントエンドコンポーネント**:
  - `frontend/src/components/shopping/ShoppingListView.tsx`
  - `frontend/src/components/shopping/ShoppingItemRow.tsx`
- **キャッシュ戦略**:
  - TanStack Query の `shopping-list` キーで管理。補充完了時は `stocks` キーも併せて invalidation。

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [ ] 発注閾値を下回る在庫が買い物リストに即座に反映されること。
- [ ] 補充完了アクションで在庫数が更新され、リストから除外されること。
- [ ] `npm run check` が全件合格すること。
