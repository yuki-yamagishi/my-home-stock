# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-033

- **対象Issue**: [ISSUE-033] 楽観排他制御（409 Conflict）発生時の入力データ保護と競合解決UIの実装
- **ステータス**: 🔵 着手前確認完了 (`status: ready`)
- **作成日**: 2026-10-05

---

## 1. 4軸事前検証サマリー

| 検証軸 | 検証項目 | 判定 | 検証結果・設計判断 |
| :--- | :--- | :---: | :--- |
| **軸1: 技術的制約** | 楽観排他制御 (JPA @Version) & TanStack Query | 🟢 PASS | バックエンドは `@Version` により 409 Conflict を正常返却中。フロントエンドの `useUpdateStock` が 409 を検知した際、`alert()` の代わりにエラー状態をモーダルへ伝播させ、最新データフェッチ（`api.getStocks()` または TanStack Query キャッシュ）と連携することで技術的整合性を担保。 |
| **軸2: UX・エッジケース** | 入力データ保護 & 競合解決フロー | 🟢 PASS | 409 発生時に `setEditingItem(null)` を呼び出さないことでローカル state（入力内容）を完全保護。モーダル内にインライン警告バナーを配置し、「自分の入力で上書き」「最新データを取り込む」の2択を明確に提示。 |
| **軸3: 永続性・互換性** | データベース整合性 & マルチテナント世帯分離 | 🟢 PASS | サーバー側の `householdId` 分離および `StockItemService.updateStockItem` のバージョンチェックロジックには一切手を入れる必要がなく、フロントエンドのみで完結。既存スキーマおよび API DTO（`StockItemInput`）との 100% 互換性を維持。 |
| **軸4: テスト自律性** | Vitest による単体・UIテスト | 🟢 PASS | `frontend/tests/components/` 配下に `EditStockModal` の競合ハンドリングテストを追加。モックされた 409 エラー下での入力保持、警告表示、最新データ反映、上書き保存の全シナリオを自動テスト可能。 |

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
1. **`frontend/src/hooks/useStockItems.ts`**:
   - `useUpdateStock()` の `onError` に `alert()` がハードコードされている。これを撤廃し、呼び出し元のコンポーネントがエラーをハンドリングできるようにする。
2. **`frontend/src/App.tsx`**:
   - `onSave` の `updateMutation.mutate` の `onError` で `setEditingItem(null)` が呼ばれている。これがモーダルをアンマウントさせて入力データを蒸発させている根本原因。
   - `setEditingItem(null)` の呼び出しを排除し、エラー情報を `EditStockModal` に渡すか、あるいは `EditStockModal` 自体が `useUpdateStock` の状態（`isError`, `error`）またはコールバックを受け取って処理できるようにリファクタリングする。
3. **`frontend/src/components/stock/EditStockModal.tsx`**:
   - 現在はフォーム送信時に `onSave(item.id, data)` を呼ぶだけで、保存失敗時のフィードバックを受け取る props や状態が存在しない。
   - `conflictData`（他端末の最新データ）や `isConflict` フラグ、および競合解決アクションを扱うクリーンな設計を導入する。
4. **過去の ADR / 設計決定**:
   - `ADR-0003` (JPA 楽観的排他制御): 409 Conflict を検知して最新情報を再取得する方針が明記されている。今回の改修は ADR-0003 の真の完成形（フロントエンドでの安全な競合解決）となる。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- 過去の `ISSUE-008` で行われた「無限ループを防ぐためにモーダルを閉じてしまう」という場当たり的なパッチワーク（つぎはぎ）を根本的に撤廃する。
- フォーム状態の管理を安易なグローバル変数等に頼るのではなく、`EditStockModal` のプロップスと内部状態の境界を整理し、React の標準的なイディオム（制御コンポーネントとエラーフィードバック）で堅牢に構築する。
