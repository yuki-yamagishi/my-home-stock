# ISSUE-002: 在庫アイテム一覧・登録・編集・削除 UI の実装

- **ステータス**: 🔵 `status: ready`
- **種別**: 🟢 `type: feature`
- **担当者**: AIエージェント / 開発者
- **作成日**: 2026-09-06
- **関連 ADR**: ADR-0001, ADR-0002

---

## 📌 課題の概要・背景 (Problem Description / Context)

バックエンド API（`StockItemController`）および OpenAPI 定義は稼働準備中であるが、ユーザーがスマートフォンや PC から在庫アイテムを一覧表示、新規登録、編集、削除（および数量消費）を行うためのフロントエンド UI を構築する必要があります。
Vue 3 (Composition API / `<script setup>`) + Tailwind CSS v4 を用いた直感的で高速な在庫管理 UI を構築します。

---

## 🎯 要件定義 (Requirements)

1. **在庫一覧表示**:
   - カテゴリ別フィルター（冷蔵食品、日用品、調味料、未分類等）。
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

- **フロントエンドコンポーネント (Vue 3)**:
  - `frontend/src/components/stock/StockItemList.vue`
  - `frontend/src/components/stock/StockItemCard.vue`
  - `frontend/src/components/stock/StockItemFormModal.vue`
- **状態管理 & 通信**:
  - `frontend/src/stores/stockStore.ts` または `frontend/src/composables/useStockItems.ts`
  - HTTP 409 競合時はトースト通知を表示し、最新データを再フェッチ。

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [ ] 在庫一覧がバックエンドから取得され、美しくレスポンシブに表示されること。
- [ ] アイテムの新規登録、更新、削除、数量消費が正常に動作すること。
- [ ] 期限間近および数量不足のバッジが正しく表示されること。
- [ ] フロントエンド単体テストおよび `npm run check` が全件合格すること。
