# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-010

- **対象Issue**: [ISSUE-010] 残量段階管理機能（4段階ステータス表示・消耗品管理）の実装
- **検証日**: 2026-09-16
- **検証者**: AIエージェント
- **ステータス**: 🟢 適合確認済 (`status: ready`)

---

## 1. 4軸事前検証サマリー

| 検証軸 | 検証項目 | 判定 | 検証内容・根拠 |
| :--- | :--- | :--- | :--- |
| **軸1: 技術的制約** | Spring Boot 4 / Flyway / React 18 / OpenAPI 3.0 | 🟢 PASS | Flyway V3 マイグレーションにより `stock_type` と `remaining_level` を安全に追加。デフォルト値 `QUANTITY` により既存データを無破壊で保持。OpenAPI 仕様と TypeScript 型を完全同期。 |
| **軸2: UX・エッジケース** | 4段階残量切り替え / 買い物リスト連動 / ワンタップ操作 | 🟢 PASS | カード上の直接タップで残量を即時切り替え。残量管理アイテムは「怪しい」「すっからかん」で買い物リスト入りし、「補充完了」ボタンで「十分」に復帰。個数管理アイテムは従来の動作を維持。 |
| **軸3: 永続性・データ分離** | 世帯マルチテナント & 楽観的排他制御 | 🟢 PASS | `StockItemRepository` の不足クエリに `householdId` 条件を維持しつつ `stockType` / `remainingLevel` 条件を安全に統合。カード更新時も `@Version` を検証し 409 Conflict を防止。 |
| **軸4: テスト自律性** | Vitest / JUnit 5 / 品質ゲート | 🟢 PASS | `stockStatus.ts` の純粋ビジネスロジック（`isShortage`, 残量設定）の単体テスト、バックエンドのサービステスト・リポジトリテスト、および `npm run check` の全自動ゲートで検証可能。 |

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
1. **在庫不足・賞味期限計算ドメイン（`frontend/src/core/stockStatus.ts`）**:
   - 既存の `isShortage(quantity, minThreshold)` が存在し、コンポーネント非依存の純粋関数としてテストされている。
   - 車輪の再発明やコンポーネント内への独自不足判定ロジックの埋め込みを禁止し、`isShortage` に `stockType` と `remainingLevel` の引数を追加して一元化する。
   - 残量ラベルやカラーメタデータも `stockStatus.ts` に純粋オブジェクトとして集約する。
2. **バックエンド リポジトリ（`StockItemRepository.java`）**:
   - `findShortageItemsByHousehold(@Param("householdId") String householdId)` が既存の不足アイテム抽出クエリとして機能している。
   - 個別の独自クエリを乱立させることなく、この JPQL に残量管理条件 `(s.stockType = 'REMAINING_LEVEL' AND s.remainingLevel IN ('LOW', 'EMPTY'))` を統合する。
3. **UI コンポーネント群**:
   - `EditStockModal.tsx`, `App.tsx` のクイック追加フォーム、一覧カード、買い物リストカードに自然な拡張として組み込む。
   - 既存の `useUpdateStock()`, `useConsumeStock()` フックをそのまま再利用し、新しいフックの不要な増殖を抑止する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- **Enum の一元管理**:
  - バックエンドに `StockType` と `RemainingLevel` の Enum を定義し、文字列のハードコードを排除。
  - フロントエンドでも `schema.d.ts` の型をインポートして利用。
- **内部数量との同期による多重防壁**:
  - 残量管理時でも `quantity` を `EMPTY=0`, `LOW=1`, `PLENTY=2`, `FULL=3` と同期させることで、仮に旧クエリや外部連携が行われても整合性を維持。

---

## 3. 結論

全 4 軸の検証および重複点検に合格。後方互換性を完全に維持し、アーキテクチャ原則に適合していることを確認。着手準備完了（Definition of Ready 達成）。
