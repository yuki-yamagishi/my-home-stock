# 実装計画書 (Implementation Plan) - ISSUE-008

- **対象Issue**: [ISSUE-008] 在庫詳細編集モーダル（EditStockModal）の実装と入力UI/UX改善
- **作成日**: 2026-09-14
- **ステータス**: 🟡 計画策定済

---

## 1. 変更対象ファイル一覧

| 変更区分 | ファイルパス | 変更概要 |
| :--- | :--- | :--- |
| **[NEW]** | `frontend/src/constants/categories.ts` | カテゴリ定数（`STOCK_CATEGORIES`, `DEFAULT_CATEGORY`）および旧カテゴリ正規化関数（`normalizeCategory`）の実装 |
| **[NEW]** | `frontend/src/components/stock/EditStockModal.tsx` | 在庫詳細編集モーダルコンポーネントの実装（品名必須バリデーション、期限クリアボタン、旧カテゴリ安全マッピング、ESC閉じ） |
| **[MODIFY]** | `frontend/src/App.tsx` | 編集モーダルステート、編集ボタン配置（各タブ）、期限クリアボタン配置、カテゴリ定数適用 |
| **[NEW]** | `frontend/tests/constants/categories.test.ts` | カテゴリ定義および `normalizeCategory` の単体テスト |

---

## 2. 実装ステップ

### Step 1: カテゴリ定数モジュール新設 (`categories.ts`)
- `STOCK_CATEGORIES` 配列（`食品`, `飲料`, `日用品・消耗品`, `医薬品`, `その他`）を定義。
- 型エイリアス `StockCategory` を export。
- `normalizeCategory(category?: string | null): StockCategory` 関数を実装：
  - `日用品` または `消耗品` の場合は `日用品・消耗品` を返却。
  - `STOCK_CATEGORIES` に合致する場合はその値を返却。
  - それ以外または null/未指定の場合は `その他` または `DEFAULT_CATEGORY` を返却。

### Step 2: 在庫詳細編集モーダル (`EditStockModal.tsx`) 実装
- Props: `item: StockItem | null`, `isOpen: boolean`, `onClose: () => void`, `onSave: (id: number, data: StockItemInput) => void`, `isSaving: boolean`。
- 初期化: `item` 開閉時に `normalizeCategory(item.category)` を使用してカテゴリ初期値を設定。
- バリデーション: `name.trim() === ''` の場合は保存ボタンを `disabled` にし、Enter 送信もブロック。
- 期限クリアボタン: 日付入力の横にワンタップで空文字にするボタンを設置。
- 送信時: `version: item.version` を付与して `onSave` を実行。

### Step 3: `App.tsx` への統合とクイック追加フォームの改善
- `editingItem` ステート（`useState<StockItem | null>(null)`）を配置。
- 在庫一覧カード（Tab 1）、買い物リスト（Tab 2）、期限間近（Tab 3）の各カードに編集ボタン（Pencil アイコン）を配置。
- クイック追加フォームのカテゴリ選択肢を `STOCK_CATEGORIES` に置き換え。
- クイック追加フォームの日付入力欄に期限クリアボタン（`×`）を配置。
- フィルタータブを `['all', ...STOCK_CATEGORIES]` に最適化（既存在庫の旧カテゴリがある場合も対応）。

### Step 4: テスト & Inner Loop 検証
- `frontend/tests/constants/categories.test.ts` を追加し、`STOCK_CATEGORIES` の網羅性および `normalizeCategory` の旧カテゴリ（日用品、消耗品）マッピングを Vitest で検証。
- `npm run check:fast` による型検査。
- `npm run test:related` による単体テスト。
- `npm run check:docs` によるドキュメント整合性検査。

---

## 3. 検証手順

1. **型検査**: `npm.cmd run check:fast`
2. **単体テスト**: `npm.cmd run test:related`
3. **総合品質ゲート**: `npm.cmd run check`
