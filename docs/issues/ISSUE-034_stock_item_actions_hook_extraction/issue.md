# Issue #034: 在庫操作ロジックの共通化（`useStockItemActions` カスタムフックの抽出）

## 1. 解決すべき課題・背景 (Why)

- **現在の問題点**: `frontend/src/App.tsx` 内に在庫アイテムの更新・消費・追加・残量変更・削除操作ハンドラ（`handleConsume`, `handleAddOne`, `handleSetRemainingLevel`, `handleDelete`）がインラインで散在し、UI レンダリングコードとデータ変更手続きが結合している。
- **背景と真の動機**: 在庫操作には楽観排他制御のための `version` 引き継ぎ、残量レベル（`REMAINING_LEVEL`）と数量（`quantity`）の整合変換（`remainingLevelToQuantity`）、およびオフライン状態の検証が必須である。これらを集約した再利用可能なカスタムフック `useStockItemActions` を提供することで、後続の UI コンポーネント共通化（ISSUE-035）およびタブ分離（ISSUE-036）においてコード重複と仕様逸脱を防ぐ。
- **放置した場合の影響**: コンポーネント分割時に操作ロジックのコピペや過剰なプロップスリレーが発生し、`version` の渡し忘れによる排他制御抜けや残量・数量の不整合バグを誘発する。

---

## 2. 変更内容の概要 (What)

- `frontend/src/hooks/useStockItemActions.ts` を新規作成し、在庫操作（消費、+1追加、残量4段階更新、削除）をカプセル化。
- `frontend/tests/hooks/useStockItemActions.test.ts` を新規作成し、各操作の引数・ペイロード・排他制御 `version` の引き継ぎを単体テストで検証。
- `frontend/src/App.tsx` のインライン操作ハンドラを新設フックの呼び出しに置換。

---

## 3. 排除するリスク (Risks to Eliminate)

- **リスク 1: 楽観的排他制御の欠落リスク**: 在庫更新時に最新エンティティの `version` 番号が正しく渡されず、同時編集時の HTTP 409 Conflict 検知がバイパスされるリスク。-> `updateMutation` に渡すペイロードへ明示的に `version: item.version` を付与し、単体テストで引数を検証する。
- **リスク 2: 残量レベルと数量の不整合リスク**: 残量 4 段階変更時に `remainingLevelToQuantity(newLevel)` が設定されず、バックエンド側の `quantity` と齟齬が生じるリスク。-> 残量更新時に `remainingLevelToQuantity(newLevel)` の適用をフック内で自動実行する。
- **リスク 3: オフライン操作の誤実行リスク**: ネットワーク切断時に更新リクエストを送信して不要なエラーを発生させるリスク。-> `useNetworkStatus()` の `isOffline` を参照し、オフライン時は操作を早期リターン（ガード）する。

---

## 4. 設計方針・アーキテクチャ決定

- `useStockItemActions` は `useConsumeStock`、`useUpdateStock`、`useDeleteStock`、`useNetworkStatus` を内部で利用するファサードフックとして実装する。
- 削除確認ダイアログ（`window.confirm`）はテスト容易性を確保するため、オプション引数 `confirmDelete` でインジェクション可能とする（デフォルトは `(msg) => window.confirm(msg)`）。
- 既存のコンポーネント側との互換性を保ち、`handleConsume`、`handleAddOne`、`handleSetRemainingLevel`、`handleDelete`、および各種 pending 状態（`isPending`, `isUpdating`, `isConsuming`, `isDeleting`）を返却する。

---

## 5. 受け入れ基準 (Acceptance Criteria / Definition of Done)

### 5.1. 機能受け入れシナリオ (Given-When-Then)

- **シナリオ 1: 個数管理アイテムの消費 (handleConsume)**
  - **Given**: 個数管理アイテム（`id: 1, quantity: 2, stockType: 'QUANTITY'`）が存在し、オンライン状態である。
  - **When**: `handleConsume(item)` を呼び出す。
  - **Then**: `consumeMutation.mutate({ id: 1, amount: 1 })` が実行される。

- **シナリオ 2: 個数管理アイテムの +1 加算 (handleAddOne) と楽観排他 version の引き継ぎ**
  - **Given**: 個数管理アイテム（`id: 1, quantity: 2, version: 3`）が存在し、オンライン状態である。
  - **When**: `handleAddOne(item)` を呼び出す。
  - **Then**: `updateMutation.mutate` が呼び出され、`quantity: 3`, `version: 3`, `stockType: 'QUANTITY'` を含む更新ペイロードが送信される。

- **シナリオ 3: 残量4段階アイテムの直接更新 (handleSetRemainingLevel)**
  - **Given**: 残量管理アイテム（`id: 2, remainingLevel: 'LOW', version: 1`）が存在し、オンライン状態である。
  - **When**: `handleSetRemainingLevel(item, 'FULL')` を呼び出す。
  - **Then**: `updateMutation.mutate` が呼び出され、`remainingLevel: 'FULL'`, `quantity: 3`（`remainingLevelToQuantity('FULL')` の結果）, `version: 1`, `stockType: 'REMAINING_LEVEL'` を含む更新ペイロードが送信される。

- **シナリオ 4: 削除操作 (handleDelete) と確認ダイアログ**
  - **Given**: 削除対象アイテムの ID（`id: 5`）が存在する。
  - **When**: 削除確認で OK（true）を選択して `handleDelete(5)` を呼び出す。
  - **Then**: `deleteMutation.mutate(5)` が実行される。キャンセル（false）時は mutate が呼び出されない。

- **シナリオ 5: オフライン状態での操作ガード**
  - **Given**: ネットワークがオフライン（`isOffline: true`）である。
  - **When**: `handleConsume`, `handleAddOne`, `handleSetRemainingLevel`, `handleDelete` のいずれかを呼び出す。
  - **Then**: いずれの mutation も呼び出されず、処理がスキップされる。

- **シナリオ 6: Mutation 実行中の重複呼び出しガード**
  - **Given**: `updateMutation.isPending` が `true` である。
  - **When**: `handleSetRemainingLevel` を呼び出す。
  - **Then**: 重複した `updateMutation.mutate` は呼び出されない。

### 5.2. PR作成前プロセス完了基準 (Pre-PR Process DoD)

- [x] 対象スコープの単体テスト（`frontend/tests/hooks/useStockItemActions.test.ts`）が作成され、全件 PASS すること。
- [x] `App.tsx` を新設フック呼び出しにリファクタリング後、既存の全テスト（コンポーネントテスト含む）が PASS すること。
- [x] プロジェクトの型検査（`npm run check:fast`）およびドキュメント整合性（`npm run check:docs`）が PASS すること。
- [x] 4軸ドキュメント（`issue.md`, `pre_verification.md`, `plan.md`, `walkthrough.md`）の整備が完了していること。

### 5.3. マージ前完了ゲート (Pre-Merge Gate)

- [ ] Outer Loop 品質ゲート（`npm run check`）が PASS すること。
- [ ] リモート CI（GitHub Actions）が PASS すること。
- [ ] 独立サブエージェント合議レビュー（`fleet_reviewer`, `fleet_completion_auditor`, `stock_domain_auditor`）の LGTM を受領していること。
- [ ] 人間（ユーザー）による最終確認とマージが実施されること。
