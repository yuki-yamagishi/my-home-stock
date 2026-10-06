# ISSUE-034 実装計画書 (Implementation Plan)

## 1. 変更対象ファイル一覧
* **新規作成**:
  * `frontend/src/hooks/useStockItemActions.ts`: 在庫操作カスタムフック
  * `frontend/tests/hooks/useStockItemActions.test.ts`: フック単体テスト
* **変更**:
  * `frontend/src/App.tsx`: インラインで定義されている操作関数を新フック呼び出しに置換

---

## 2. 実装手順

### Step 1: `useStockItemActions` フックの作成
* `useConsumeStock`、`useUpdateStock`、`useDeleteStock`、`useNetworkStatus` をインポート。
* 以下の操作メソッドを実装：
  * `handleConsume(item: StockItem, amount?: number)`
  * `handleAddOne(item: StockItem)`
  * `handleSetRemainingLevel(item: StockItem, newLevel: RemainingLevel)`
  * `handleDelete(id: number)`
* `isPending` や `isOffline` のガードを適用。

### Step 2: フック単体テストの作成
* `renderHook` を用いて、各操作メソッドが適切なペイロード（特に `version` や `remainingLevelToQuantity`）で mutation を呼び出すことを検証。

### Step 3: `App.tsx` への適用
* `App.tsx` 内の重複する操作関数を削除し、`useStockItemActions` から取得したハンドラに置き換える。

### Step 4: 動作検証
* `npm run test:run` によるフロントエンド全テストの実行。
* `npm run check:fast` による型検査。

---

## 3. レビュー観点
* 楽観的排他制御の `version` 番号が欠落していないか。
* オフラインガードが正しく機能しているか。
* `App.tsx` の行数が削減され、関心の分離が進んでいるか。
