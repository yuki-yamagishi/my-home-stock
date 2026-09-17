# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-014

- **対象Issue**: 在庫一覧の並び替え（ソート）機能の実装
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-17

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **純粋コアロジックの不可侵（ドメイン不変則第3条）**:
  - ソート処理は React コンポーネント（`App.tsx`）内にインライン実装せず、`frontend/src/core/stockSort.ts` として純粋関数に分離する。
  - DOM や React Hooks に依存しない純粋 TypeScript 関数とすることで、UI レンダリングと切り離した単体テストを可能にする。
- **配列の非破壊ソート**:
  - `Array.prototype.sort()` は元の配列を破壊的（in-place）に変更するため、TanStack Query のキャッシュや React state を直接変更する危険がある。
  - `[...items].sort(...)` により浅いコピーを作成してからソートを実行する。

### 1.2. UX・エッジケース
- **期限日未設定（NULLS LAST）の徹底**:
  - 「期限が近い順（昇順）」において、未設定品目が先頭に紛れ込むと期限切迫アイテムが埋もれる。
  - 期限ありアイテムを昇順/降順に並べ、未設定アイテム（null/undefined/空文字）は常に末尾に安定配置する。
- **残量レベル（4段階）と数量管理（数値）の混在ソート**:
  - 異なる管理タイプが混在する場合、「残量が少ない順」では買い物候補（要補充: shortage）アイテムを最優先グループとし、その中で正規化スコア（EMPTY=0, LOW=1, PLENTY=2, FULL=3 / quantity）の昇順で並べる。
- **同一ソートキー時の安定性**:
  - ソートキーの値が同一である場合、品名（`localeCompare('ja')`）によるタイブレークを行い、画面のちらつきや不安定な並び順を防ぐ。
- **モバイル画面でのレイアウト・操作性**:
  - 画面幅 375px〜 のモバイル端末でも、検索バーの横にアイコン付き `<select>` が自然に収まるよう、コンパクトな UI（高さ 36px, `h-9`）とする。

### 1.3. データ永続性・互換性
- **バックエンド API / スキーマへの影響なし**:
  - ソートはクライアントサイド（TanStack Query で取得済みの `allStocks`）に対して適用するため、DB マイグレーションや OpenAPI スキーマ変更は発生しない。
  - バックエンドから返却される既存の `createdAt`, `updatedAt`, `expiryDate`, `quantity`, `remainingLevel` の各フィールドをそのまま活用する。

### 1.4. テスト自律性
- **高速な単体テスト反復（Inner Loop）**:
  - `frontend/tests/core/stockSort.test.ts` を新設し、Vitest でミリ秒単位で全ソート条件・エッジケースを自動検証可能にする。
  - モックや外部サーバーを一切必要としない純粋関数のテストとして完結させる。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- `frontend/src/core/stockStatus.ts`:
  - `isShortage`, `remainingLevelToQuantity`, `REMAINING_LEVEL_ORDER` が既に存在。
  - これらを再利用して、残量・数量比較ロジックを共通化する（車輪の再発明の防止）。
- `frontend/src/constants/categories.ts`:
  - カテゴリ定義が存在。カテゴリ順ソートでは既存のカテゴリ文字列をそのまま比較可能。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- `App.tsx` の既存 `filteredStocks` を `sortStockItems(filteredStocks, sortBy)` のようにパイプライン処理することで、既存の検索クエリ絞り込み・カテゴリ絞り込みロジックを破壊せず、クリーンに統合する。
