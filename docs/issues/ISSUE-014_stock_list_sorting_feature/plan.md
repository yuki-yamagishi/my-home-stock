# 実装計画書 (Implementation Plan) - ISSUE-014

- **対象Issue**: 在庫一覧の並び替え（ソート）機能の実装
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-17

---

## 1. 変更ファイル一覧

### 新規追加
- `frontend/src/core/stockSort.ts`: 純粋ドメインロジック（`StockSortKey`, `STOCK_SORT_OPTIONS`, `sortStockItems` 関数）
- `frontend/tests/core/stockSort.test.ts`: Vitest 単体テスト（7 種類のソート順、エッジケース、非破壊性検証）

### 変更
- `frontend/src/App.tsx`: `sortBy` state 追加、ソートセレクター UI 配置、`filteredStocks` へのソート適用
- `docs/issues/ISSUE-014_stock_list_sorting_feature/walkthrough.md`: 成果レポート・動作検証ログ

---

## 2. 実装ステップ

1. **Step 1: 単体テストの先行作成 (TDD Red)**:
   - `frontend/tests/core/stockSort.test.ts` を作成し、期待されるソート仕様（カテゴリ順、期限昇順/降順、残量昇順/降順、名前順、更新日時順、期限未設定末尾、非破壊ソート）を記述。
2. **Step 2: 純粋ドメインソート関数の実装 (TDD Green)**:
   - `frontend/src/core/stockSort.ts` を実装し、単体テストを全件パスさせる。
3. **Step 3: UI 統合 & レスポンシブ調整**:
   - `frontend/src/App.tsx` に並び替えセレクター（`<select>` + Lucide アイコン）を追加。
   - `filteredStocks` を `sortStockItems` でラップして並び替え結果をレンダリング。
4. **Step 4: 品質検証 & 成果レポート作成**:
   - `check:fast`, `test:related`, `check:docs`, `check` を通過させ、`walkthrough.md` を作成。
