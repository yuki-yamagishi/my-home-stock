# 実装計画書 (Implementation Plan) - ISSUE-012

- **対象Issue**: [ISSUE-012] 買い物リストのカテゴリ別表示・絞り込み導入および在庫管理画面の重複追加ボタン整理
- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **作成日**: 2026-09-17

---

## 1. 変更ファイル一覧

### 新規追加
- `frontend/src/core/shoppingList.ts`: 買い物リストのカテゴリ別グルーピング・カウント用純粋ドメインロジック
- `frontend/tests/core/shoppingList.test.ts`: `shoppingList.ts` に対する Vitest 単体テスト

### 変更
- `frontend/src/App.tsx`:
  - 在庫管理画面上部ボタンへの `hidden sm:flex` 追加（モバイルでの非表示化・右下FABへの一本化）
  - 買い物リスト画面へのカテゴリ絞り込みピルおよびセクション別グループ表示の導入
- `docs/issues/README.md`: ISSUE-012 のテーブル行追加
- `docs/pre_phase_verification.md`: ISSUE-012 へのルートポインタ更新
- `docs/implementation_plan.md`: ISSUE-012 へのルートポインタ更新
- `docs/walkthrough.md`: ISSUE-012 へのルートポインタ更新

---

## 2. 実装ステップ

### ステップ 1: ドメインコアロジック実装 & 単体テスト (TDD)
1. `frontend/tests/core/shoppingList.test.ts` を作成し、グルーピング・カウントのテストケースを記述（Red）。
2. `frontend/src/core/shoppingList.ts` を作成し、`groupShoppingListByCategory` および `getShoppingListCategoryCounts` を実装。
3. `npm.cmd run test:related` を実行し、全テストのパスを確認（Green）。

### ステップ 2: 在庫管理画面の在庫追加ボタン整理
1. `frontend/src/App.tsx` の 250〜258 行目にある「在庫を追加」ボタンに `hidden sm:flex` を追加。
2. モバイル（`< sm`）でボタンが消え、右下のFABが残ることを確認。デスクトップでは上部にボタンが維持されることを確認。

### ステップ 3: 買い物リスト画面のカテゴリ絞り込み & グループ表示実装
1. `App.tsx` 内で `selectedShoppingCategory` のステートを管理。
2. 買い物リスト上部にカテゴリピル（すべて、食品、飲料、日用品・消耗品、医薬品、その他）を配置し、各カテゴリの不足アイテム件数をバッジ表示。
3. `groupShoppingListByCategory` を呼び出してカテゴリごとにセクションヘッダー（見出し・件数）付きでアイテムカードをレンダリング。
4. 絞り込み時に該当アイテムがない場合の Empty State を実装。

### ステップ 4: 動作検証 & 成果レポート作成
1. `npm.cmd run check:fast` による型検査。
2. `walkthrough.md` に動作検証結果と実装成果を記録。
3. `npm.cmd run check` によるフル品質ゲート（Outer Loop）通過。
