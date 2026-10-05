# 実装計画書 (Implementation Plan) - ISSUE-033

- **対象Issue**: [ISSUE-033] 楽観排他制御（409 Conflict）発生時の入力データ保護と競合解決UIの実装
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-10-05

---

## 1. 変更ファイル一覧

### 新規追加
- `frontend/tests/components/EditStockModal.test.tsx` (または `.test.ts`): 409 Conflict 発生時の入力保持・インライン警告・最新データ取り込み・上書き保存の包括的単体テスト

### 変更
- `frontend/src/hooks/useStockItems.ts`: `useUpdateStock` から `alert()` を完全撤廃し、最新キャッシュ再取得を行いつつエラーをコンポーネントへ安全に伝播
- `frontend/src/components/stock/EditStockModal.tsx`:
  - 競合状態（`conflictItem`）の props / state 管理
  - インライン競合警告バナー（他端末の変更点表示）
  - 「自分の入力で上書き保存」および「最新データを取り込む」アクションボタンの実装
- `frontend/src/App.tsx`:
  - `updateMutation` の `onError` でのモーダル強制クローズ（`setEditingItem(null)`）を完全撤廃
  - 409 発生時に最新キャッシュから当該アイテムの最新情報を抽出し、`EditStockModal` へ競合情報として渡す連携

---

## 2. 実装ステップ

### ステップ 1: `useUpdateStock` フックのリファクタリング
- `alert()` を削除。
- 409 エラー時も `queryClient.invalidateQueries({ queryKey: STOCK_KEYS.all })` を維持してバックグラウンドで最新データを再取得しつつ、呼び出し元コンポーネントがエラーを補足できるようにする。

### ステップ 2: `EditStockModal` への競合解決 UI 実装
- Props に `conflictItem?: StockItem | null` および `onResolveConflict?: (resolvedData: StockItemInput) => void` などの競合制御インターフェースを追加。
- 409 発生時、モーダル上部に警告バナーを表示：
  - 「⚠️ 他の端末によって内容が更新されました」
  - 他端末の変更点（現在のサーバー上の値）を提示。
- 解決アクションボタンの配置：
  - 「自分の入力で上書き保存」: サーバー最新の `version` を採用して現在のフォーム入力値で再保存。
  - 「最新データを取り込む」: サーバー最新の値をフォーム各フィールドに上書き反映し、競合状態を解除。

### ステップ 3: `App.tsx` との連携
- `updateMutation.mutate` の `onError` で `setEditingItem(null)` を行わず、エラー時に `allStocks` または再フェッチされた最新アイテムを特定して `conflictItem` としてモーダルへ渡す。
- 成功時は `setEditingItem(null)` でモーダルを正常クローズ。

### ステップ 4: 単体テスト作成と Inner Loop 検証
- Vitest で `EditStockModal` の 409 競合シナリオ（入力保持、警告表示、取り込み、上書き）を検証する単体テストを実装。
- `npm.cmd run test:related` および `npm.cmd run check:fast` で高速検証。

### ステップ 5: 全体品質ゲートと成果ドキュメントまとめ
- `npm.cmd run check`（シークレット、ドキュメント整合性、型検査、全量テスト、本番ビルド）を実行。
- `walkthrough.md` に成果と動作検証ログを記録。
