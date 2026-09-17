# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-012

- **対象Issue**: [ISSUE-012] 買い物リストのカテゴリ別表示・絞り込み導入および在庫管理画面の重複追加ボタン整理
- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **作成日**: 2026-09-17

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **Tailwind CSS のレスポンシブブレークポイント整合性**:
  - `sm:` (640px) を基準とする。
  - 在庫管理画面上部の「在庫を追加」ボタンは `hidden sm:flex` を指定することで、モバイル（`< sm`）では完全非表示、デスクトップ（`sm:` 以上）でのみ表示される。
  - モバイル専用 FAB（`fixed ... sm:hidden`）と綺麗に対をなし、画面幅によって導線が過不足なく切り替わる。
- **純粋コアロジックの不可侵（ドメイン制約第3条）**:
  - グルーピング処理・カウント処理は React コンポーネント（`App.tsx`）内に直接ベタ書きせず、`frontend/src/core/shoppingList.ts` に純粋関数として分離する。
  - 引数として `StockItem[]` を受け取り、React や DOM に一切依存しない形で結果を返却するため、Vitest でミリ秒単位の高速単体テストが可能。

### 1.2. UX・エッジケース
- **空状態（Empty State）の2層ハンドリング**:
  1. 買い物リスト全体が0件の場合: 「現在、補充が必要な在庫アイテムはありません！」（既存の良好な状態表示）。
  2. 買い物リスト全体にはアイテムがあるが、選択したカテゴリ（例: 「医薬品」）にはアイテムが0件の場合: 「このカテゴリには補充が必要なアイテムはありません。」と明示し、ユーザーに不要な混乱を与えない。
- **カテゴリ未設定・未知カテゴリのハンドリング**:
  - `normalizeCategory`（`constants/categories.ts`）を通すことで、古いデータや未設定データがあっても「その他」に自動集約され、画面上に確実に表示される（データの隠蔽・消失リスクを防止）。
- **カテゴリ並び順の一貫性**:
  - `STOCK_CATEGORIES`（`食品`、`飲料`、`日用品・消耗品`、`医薬品`、`その他`）の標準定義順にグループ見出しをソートして表示し、毎回順序がバラバラになる認知負荷を排除する。

### 1.3. データ永続性・互換性
- **バックエンド API・DB スキーマへの影響ゼロ**:
  - 今回の改修はフロントエンドの表示・フィルタリング・レイアウト最適化に閉じており、OpenAPI スキーマ（`docs/openapi.json`）や JPA エンティティ、Flyway マイグレーションの変更は不要。
  - 既存の `useShoppingList()` フックから返却される `StockItem[]` のデータ構造をそのまま活用する。

### 1.4. テスト自律性
- **TDD 高速反復（Inner Loop）の担保**:
  - `frontend/src/core/shoppingList.ts` に対する単体テスト `frontend/tests/core/shoppingList.test.ts` を作成。
  - `npm.cmd run test:related` により 1 秒未満でテスト反復が可能。
- **型検査（Type-check）**:
  - `npm.cmd run check:fast` により、TypeScript Strict モードでの型整合性を瞬時に検証可能。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **カテゴリ定義と正規化**:
  - `frontend/src/constants/categories.ts` に既に `STOCK_CATEGORIES`（配列）および `normalizeCategory(category?: string | null)` 関数が存在する。
  - 新たに独自でカテゴリ配列をハードコードせず、既存の `STOCK_CATEGORIES` および `normalizeCategory` を再利用する。
- **在庫管理画面（Stocks List）のカテゴリフィルター実装**:
  - `App.tsx` の 70〜74 行目で `categories`（`Set` を用いたユニーク抽出）を行っている。
  - 買い物リストでも同様に、全カテゴリからアイテムが存在するカテゴリを動的に判別するか、または標準カテゴリをベースに件数バッジ付きでピルを表示する。
- **追加ボタンのレスポンシブクラス**:
  - 買い物リスト画面（`App.tsx` 475行目）では既に `hidden sm:flex` が指定されていた。在庫管理画面（250行目）に同様のクラスを適用することでコードベース全体の一貫性を確立する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- **場当たり的なインラインフィルタの排除**:
  - `App.tsx` 内で直接 `.filter().reduce()` などを複雑にネストさせて書くパッチワークを避け、`frontend/src/core/shoppingList.ts` に `groupShoppingListByCategory` と `getShoppingListCategoryCounts` として集約・カプセル化する。
