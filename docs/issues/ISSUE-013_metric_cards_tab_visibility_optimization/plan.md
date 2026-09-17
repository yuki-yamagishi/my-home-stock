# 実装計画書 (Implementation Plan) - ISSUE-013

- **対象Issue**: [ISSUE-013] 買い物・期限タブにおけるメトリックカード非表示化（一覧性・視認性最適化）
- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **作成日**: 2026-09-17

---

## 1. 変更ファイル一覧

### 変更
- `frontend/src/App.tsx`: メトリックカード群を `<main>` 直下から `activeTab === 'stocks'` コンテナ内へ移動
- `docs/issues/README.md`: ISSUE-013 のテーブル行追加
- `docs/pre_phase_verification.md`: ISSUE-013 へのルートポインタ更新
- `docs/implementation_plan.md`: ISSUE-013 へのルートポインタ更新
- `docs/walkthrough.md`: ISSUE-013 へのルートポインタ更新

---

## 2. 実装ステップ

### ステップ 1: メトリックカードの表示制御（`App.tsx`）
1. `App.tsx` 内の `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">...</div>` を、`{activeTab === 'stocks' && ( ... )}` の先頭に移動。
2. 買い物タブおよび期限タブでカードが描画されないことを確認。

### ステップ 2: 動作検証 & 成果レポート作成
1. `npm.cmd run check:fast` による型検査。
2. `walkthrough.md` に動作検証結果と実装成果を記録。
3. `npm.cmd run check` によるフル品質ゲート通過。
