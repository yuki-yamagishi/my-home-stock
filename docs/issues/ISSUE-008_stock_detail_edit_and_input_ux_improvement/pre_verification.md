# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-008

- **対象Issue**: [ISSUE-008] 在庫詳細編集モーダル（EditStockModal）の実装と入力UI/UX改善
- **検証日**: 2026-09-14
- **検証者**: AIエージェント
- **ステータス**: 🟢 適合確認済 (`status: ready`)

---

## 1. 4軸事前検証サマリー

| 検証軸 | 検証項目 | 判定 | 検証内容・根拠 |
| :--- | :--- | :---: | :--- |
| **軸1: 技術的制約** | React 18 / TanStack Query / モーダルアクセシビリティ | 🟢 PASS | 既存の `useUpdateStock()` ミューテーションおよび `PUT /api/v1/stocks/{id}` は完成しており、API 変更不要で接続可能。Tailwind CSS によるモーダルレイアウトと ESC キーハンドリングを安全に実装可能。 |
| **軸2: UX・エッジケース** | 楽観排他競合 & 旧カテゴリ自動移行 & 日付クリア | 🟢 PASS | 409 Conflict 発生時は `useUpdateStock` のエラーコールバックで自動アラート＆キャッシュ再取得。旧「日用品」「消耗品」は `normalizeCategory` で自動的に「日用品・消耗品」へ安全初期選択され意図せぬ上書きを防止。品名空文字時はボタン非活性化で拒絶。 |
| **軸3: 永続性・データ分離** | 世帯マルチテナント & バージョン整合 | 🟢 PASS | 更新 API は認証プリンシパルから所属世帯 ID を強制バインド。リクエストボディの `version` を検証して安全に永続化。 |
| **軸4: テスト自律性** | Vitest / 型検査 / 品質ゲート | 🟢 PASS | `categories.ts` の定数および `normalizeCategory` 関数の単体テスト、モーダルのバリデーションロジック、および TypeScript Strict 型検査（`npm run check:fast`）で自動検証可能。 |

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
1. **API クライアント & カスタムフック**:
   - `frontend/src/api/client.ts` の `api.updateStock(id, data)` が既に存在。
   - `frontend/src/hooks/useStockItems.ts` の `useUpdateStock()` が既に存在し、排他制御エラー（HTTP 409）のハンドリング・キャッシュ無効化（`invalidateQueries`）が実装済み。
   - 新規に API 通信フックやリクエスト関数を作成してはならず、既存の `useUpdateStock` をそのまま利用すること。
2. **UI コンポーネント基盤**:
   - `frontend/src/components/ui/` 配下に `Button`, `Card`, `Input`, `Badge` が存在。
   - 既存の UI コンポーネントを活用し、余計な外部ライブラリを追加せずに一貫したデザインを維持すること。
3. **既存モーダルの参考**:
   - `frontend/src/components/household/FamilyMembersModal.tsx` が先行モーダルとして実装済み。
   - ダイアログのオーバーレイ背景、ESC キー閉じ、ヘッダー・フッター構成のデザインパターンを踏襲すること。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- **カテゴリ定義の重複排除と旧データ保護**:
  - 現状は `App.tsx` 内にカテゴリ名のハードコードが散見される。
  - `frontend/src/constants/categories.ts` を新設して一元管理し、クイック追加・詳細編集・一覧フィルターの全箇所でこの定数をインポートして使用する。
  - さらに `normalizeCategory(category: string): StockCategory` を定義し、旧カテゴリ（「日用品」「消耗品」）を編集時に自動で「日用品・消耗品」へマッピングして意図せぬ先頭上書きを防止する。
- **日付クリアの統一**:
  - クイック追加フォームと詳細編集モーダルの両方で同一のクリアロジック（`expiryDate: ''`）を適用する。

---

## 3. 結論

全 4 軸の検証および重複点検に合格。DoR 監査指摘（旧カテゴリ安全移行、品名空文字拒絶シナリオ）を完全に網羅し、着手準備完了（Definition of Ready 達成）を確認。
