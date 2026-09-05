# [ISSUE-004] 家族間マルチデバイス共有と世帯切り替え UI の実装

* **ステータス**: 🟡 `status: backlog`
* **種別**: 🟢 `type: feature`
* **担当者**: 未定
* **作成日**: 2026-09-06
* **関連 ADR / PR**: ADR-0007

---

## 📌 課題の概要・背景 (Problem Description / Context)

ADR-0007 にて先行導入された `household_id` マルチテナント基盤を活用し、ユーザーが家族共有コード（世帯 ID）を発行・共有・入力することで、夫婦や家族のスマートフォン同士で同一の在庫リストをリアルタイムに共有・閲覧・同期できるようにする。

---

## 🎯 要件定義 (Requirements)

1. **世帯コード設定画面**:
   - 現在の世帯 ID（デフォルト: `default`）の表示。
   - 新規世帯 ID の生成（UUID / 短縮ランダムコード）または既存世帯 ID の入力・参加機能。
2. **ローカルストレージ保持 & ヘッダー自動送信**:
   - 参加中の世帯 ID をブラウザの `localStorage` に保持。
   - API クライアント（`frontend/src/api/client.ts`）が自動的に `X-Household-Id` リクエストヘッダーに付与。
3. **QRコード招待機能**:
   - 世帯参加 URL または世帯 ID の QR コードを表示し、家族のスマホカメラで即座に参加完了。

---

## 🛠️ 技術設計・実装方針 (Technical Notes / Design)

- **クライアント**:
  - `frontend/src/context/HouseholdContext.tsx`
  - `frontend/src/components/settings/HouseholdSettingsModal.tsx`

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [ ] 世帯 ID を変更すると、その世帯の在庫アイテムのみが表示されること。
- [ ] 家族の端末で同一の世帯 ID を指定した場合、更新内容が共有されること。
- [ ] `npm run check` が全件合格すること。
