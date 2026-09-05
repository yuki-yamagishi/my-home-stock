# [ISSUE-001] 在庫アイテム一覧・登録・編集・削除 UI の実装

* **ステータス**: 🔵 `status: ready`
* **種別**: 🟢 `type: feature`
* **担当者**: AIエージェント
* **作成日**: 2026-09-06
* **関連 ADR / PR**: ADR-0003, ADR-0004, ADR-0007

---

## 📌 課題の概要・背景 (Problem Description / Context)

バックエンド API（`StockItemController`）および TypeScript 型（`schema.d.ts`）は既に稼働・テスト済みであるが、ユーザーが実際にスマートフォンや PC から在庫アイテムを一覧表示、新規登録、編集、削除（および数量消費）を行うためのフロントエンド UI がまだ初期モック状態である。
React 18 + Tailwind CSS + TanStack Query を用いた実用的な在庫管理 UI を構築する。

---

## 🎯 要件定義 (Requirements)

1. **在庫一覧表示**:
   - カテゴリ別タブまたはフィルター機能（冷蔵食品、日用品、調味料、未分類等）。
   - アイテム名、数量、単位、賞味期限、ステータスバッジ（適正・期限間近・不足）の表示。
2. **在庫消費ワンタップ操作**:
   - 一覧のカードから数量をワンタップで「-1」減算消費できるボタン（`POST /api/v1/stocks/{id}/consume`）。
3. **新規登録・編集モーダル / フォーム**:
   - 品名、カテゴリ、数量、単位、発注閾値（minThreshold）、賞味期限、メモの入力フォーム。
   - 楽観的排他制御用 `version` を自動添付した更新リクエスト。
4. **削除確認ダイアログ**:
   - 誤タップを防ぐ確認ダイアログの表示と削除実行。

---

## 🛠️ 技術設計・実装方針 (Technical Notes / Design)

- **フロントエンドコンポーネント**:
  - `frontend/src/components/stock/StockItemList.tsx`
  - `frontend/src/components/stock/StockItemCard.tsx`
  - `frontend/src/components/stock/StockItemFormModal.tsx`
- **状態管理 & キャッシュ**:
  - `frontend/src/hooks/useStockItems.ts`: `useQuery` および `useMutation` でクエリ無効化・自動再取得。
  - HTTP 409 競合時はトースト通知を表示し、最新データを再フェッチ。

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [ ] 在庫一覧がバックエンドから取得され、美しくレスポンシブに表示されること。
- [ ] アイテムの新規登録、更新、削除、数量消費が正常に動作すること。
- [ ] 期限間近および数量不足のバッジが正しく表示されること。
- [ ] 単体テスト（Vitest）および `npm run check` が全件合格すること。
