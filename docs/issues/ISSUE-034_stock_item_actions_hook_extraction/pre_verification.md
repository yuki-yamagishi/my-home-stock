# Issue #034 事前検証ログ (Pre-Phase Verification)

## 1. 現状調査・コードベース解析

- **対象コンポーネント**: `frontend/src/App.tsx` (Dashboard コンポーネント内のインライン操作ハンドラ), `frontend/src/hooks/useStockItems.ts`
- **既存の挙動**: `App.tsx` 行 139〜183 に `handleConsume`、`handleAddOne`、`handleSetRemainingLevel`、`handleDelete` が直接定義されている。各ハンドラは `useConsumeStock`、`useUpdateStock`、`useDeleteStock` の mutation を個別に呼び出し、各タブ（在庫一覧、買い物リスト、期限間近リスト）のカード要素やボタンから直接参照されている。

---

## 2. 影響範囲の特定 (Impact Analysis)

- **変更対象ファイル**: `frontend/src/hooks/useStockItemActions.ts` (新規作成)、`frontend/tests/hooks/useStockItemActions.test.ts` (新規作成)、`frontend/src/App.tsx` (ハンドラ置換)
- **影響を受けるコンポーネント**: `Dashboard` 内の「在庫一覧タブ」「買い物リストタブ」「期限間近タブ」の操作ボタン群。既存の DOM 構造やイベント Props は維持するためコンポーネントテストの破壊はない。

---

## 3. 重複・パッチワーク点検 (Impact & Duplication Check)

- **既存の類似機能・共通基盤の有無**: `useStockItems.ts`（TanStack Query ミューテーション）、`stockStatus.ts`（`remainingLevelToQuantity`）、`useNetworkStatus.ts`（オフライン検知）が存在し、これらを再利用する。
- **過去の ADR / 設計決定との整合性**: [ADR-0003]（JPA 楽観排他制御）の `version` 引き継ぎ規約、および [ADR-0002]（オフライン閲覧保証）の更新抑止規約に準拠する。
- **根本的解決（リファクタリング含む）の妥当性判断**: `App.tsx` から操作手続きを抽出し単一責任と関心分離を確立することで、後続の ISSUE-035/036 での重複実装と不整合バグを防止する根本設計改善である。

---

## 4. 事前検証手順と結果

- **検証項目**: 既存の型検査、ドキュメント整合性、関連テストの実行状態
- **実行コマンド / 手順**: `npm.cmd run check:fast`, `npm.cmd run check:docs`, `npx vitest run tests/hooks/useNetworkStatus.test.ts`
- **検証結果**: 型検査（エラー0件）、ドキュメント整合性（ADR 14件、Issue 21件検証合格）、関連テスト（5件全件PASS）
