# 実装計画書 (Implementation Plan) - ISSUE-010

- **対象Issue**: [ISSUE-010] 残量段階管理機能（4段階ステータス表示・消耗品管理）の実装
- **作成日**: 2026-09-16
- **担当者**: AIエージェント

---

## 1. 概要

常に1袋・1本のみを常備し、計量が困難な消耗品（調味料・洗剤等）向けに、4段階の残量レベル（十分・まだまだ・怪しい・すっからかん）による直感的な在庫管理、カード上でのワンタップ残量変更、および買い物リスト自動連携を実装する。

---

## 2. 変更対象ファイル一覧

### 2.1. データベース & バックエンド
1. `src/main/resources/db/migration/V3__add_stock_type_and_remaining_level.sql` [NEW]
   - `stock_type`, `remaining_level` 列追加、インデックス作成。
2. `src/main/java/com/myhomestock/domain/entity/StockType.java` [NEW]
   - `QUANTITY`, `REMAINING_LEVEL` の Enum。
3. `src/main/java/com/myhomestock/domain/entity/RemainingLevel.java` [NEW]
   - `EMPTY`, `LOW`, `PLENTY`, `FULL` の Enum および `decrease()` メソッド。
4. `src/main/java/com/myhomestock/domain/entity/StockItem.java` [MODIFY]
   - `stockType`, `remainingLevel` フィールド、Builder、PrePersist デフォルト。
5. `src/main/java/com/myhomestock/domain/dto/StockItemRequestDto.java` [MODIFY]
   - フィールド追加、Swagger スキーマ。
6. `src/main/java/com/myhomestock/domain/dto/StockItemResponseDto.java` [MODIFY]
   - フィールド追加、Swagger スキーマ。
7. `src/main/java/com/myhomestock/repository/StockItemRepository.java` [MODIFY]
   - 不足品抽出クエリへの残量条件統合。
8. `src/main/java/com/myhomestock/service/StockItemService.java` [MODIFY]
   - 作成・更新・消費ロジックの残量対応。
9. `src/test/java/com/myhomestock/StockItemServiceTest.java` [NEW / MODIFY]
   - 残量管理アイテムのテストケース追加。

### 2.2. OpenAPI 仕様書 & フロントエンド
1. `docs/openapi.json` [MODIFY]
   - `StockType`, `RemainingLevel` の追加と DTO 反映。
2. `frontend/src/api/schema.d.ts` [MODIFY]
   - 型定義の更新（OpenAPI同期）。
3. `frontend/src/core/stockStatus.ts` [MODIFY]
   - `isShortage` ロジックの拡張、残量レベル表示設定定義。
4. `frontend/tests/core/stockStatus.test.ts` [MODIFY]
   - 残量アイテムの不足判定単体テスト。
5. `frontend/src/components/stock/EditStockModal.tsx` [MODIFY]
   - 管理方法切り替え、4段階残量セレクターの実装。
6. `frontend/src/App.tsx` [MODIFY]
   - クイック追加フォーム、在庫カード（ワンタップ残量ボタン）、買い物リストカード（補充完了ボタン）の実装。

### 2.3. ドキュメント & ADR
1. `docs/adr/0012-remaining-level-stock-management.md` [NEW]
2. `docs/adr/README.md` [MODIFY]

---

## 3. 段階的実装手順

- [ ] **フェーズ 1**: DB マイグレーション & バックエンド ドメイン・API 実装
- [ ] **フェーズ 2**: バックエンド単体テスト検証 (`.\mvnw.cmd test`)
- [ ] **フェーズ 3**: OpenAPI 仕様書更新 & `schema.d.ts` 同期
- [ ] **フェーズ 4**: フロントエンド Core ロジック実装 & Vitest 単体テスト
- [ ] **フェーズ 5**: フロントエンド UI（モーダル、クイック追加、カード）実装
- [ ] **フェーズ 6**: ADR-0012 作成 & README 更新
- [ ] **フェーズ 7**: ローカル品質ゲート (`npm run check`) 通過確認
