# 実装計画書 (Implementation Plan) - ISSUE-011

- **対象Issue**: [ISSUE-011] スマートフォン向けUI/UX最適化（ヘッダー見切れ解消・ボトムナビ導入・在庫追加モーダル化）
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-16

---

## 1. 変更ファイル一覧

### 新規追加
- `frontend/src/components/stock/CreateStockModal.tsx`:
  - 在庫新規追加用のモーダル（ポップアップ）コンポーネント。
  - 個数管理 / 4段階残量管理のトグル切り替え、バリデーション、単位設定、期限クリアボタン、メモ入力を内包。
- `frontend/src/components/layout/BottomNav.tsx`:
  - スマートフォン専用（`sm:hidden`）の画面下部固定ナビゲーションバー。
  - 「在庫」「買い物」「期限」の3タブ切り替えおよび件数バッジ表示。

### 変更
- `frontend/src/components/layout/Header.tsx`:
  - モバイル時のヘッダー表示をスリム化（ブランドロゴ縮小/世帯名強調、タブの `hidden sm:flex` 化、世帯管理のアイコン化）。
  - 360px 画面でもアバター・ログアウトが絶対に見切れないレイアウト。
- `frontend/src/App.tsx`:
  - 画面上部の常時表示「在庫クイック追加」フォームを撤去。
  - `CreateStockModal` とその開閉ステート（`isCreateOpen`）の導入。
  - 在庫一覧・買い物リスト上部の「+ 在庫を追加」ボタンおよび画面右下固定のモバイルFAB（`+`）の配備。
  - 画面最下部に `<BottomNav>` を配置し、下部パディング（`pb-28`）を確保。
- `docs/issues/ISSUE-011_mobile_header_and_quick_add_ux_improvement/walkthrough.md`:
  - 実装成果レポート、画面検証、レビュー対応履歴の記録。

---

## 2. 実装ステップ

1. **ブランチ作成**:
   - `feature/issue-11-mobile-header-and-quick-add-ux-improvement` を作成。
2. **新規コンポーネント実装**:
   - `frontend/src/components/layout/BottomNav.tsx` を実装。
   - `frontend/src/components/stock/CreateStockModal.tsx` を実装（個数/残量管理の完全移植）。
3. **ヘッダーのレスポンシブ最適化**:
   - `frontend/src/components/layout/Header.tsx` を改修し、モバイル時の見切れを防止。
4. **App.tsx の統合とリファクタリング**:
   - 常時表示フォームを撤去し、モーダル呼び出しボタン & モバイルFAB & ボトムナビを配備。
5. **Inner Loop 検証**:
   - `npm run check:fast` (型検査)
   - `npm run test:related` (単体テスト)
6. **Outer Loop 検証 & ドキュメント更新**:
   - `npm run check` (統合品質ゲート)
   - `walkthrough.md` の記録。
7. **Git コミット & プッシュ & PR作成 & Fleet合議レビュー**:
   - `git commit` -> `git push` -> `gh pr create` -> Fleet レビュー受領。
