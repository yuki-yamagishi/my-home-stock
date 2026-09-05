# [ISSUE-003] PWA カメラによる JAN コード / バーコード読み取り機能の導入

* **ステータス**: 🟡 `status: backlog`
* **種別**: 🟢 `type: feature`
* **担当者**: 未定
* **作成日**: 2026-09-06
* **関連 ADR / PR**: ADR-0002

---

## 📌 課題の概要・背景 (Problem Description / Context)

手入力による品名や在庫数の入力負荷を減らし、日用品や食品のパッケージにあるバーコード（JANコード / EAN-13）をスマートフォンのカメラで読み取ることで、在庫の即時検索・登録・消費を素早く行えるようにする。

---

## 🎯 要件定義 (Requirements)

1. **Barcode Detection API / ライブラリ連携**:
   - Web 標準の `BarcodeDetector` API（対応ブラウザ）または軽量ライブラリ（`@zxing/library` 等）によるカメラ映像解析。
2. **バーコード読み取りモーダル**:
   - カメラ権限をリクエストし、枠内にバーコードを捉えると数値を即時認識。
3. **登録・消費フローの高速化**:
   - 既存在庫に同一バーコードがあれば「数量 +1（補充）」または「数量 -1（消費）」をワンタップ提示。

---

## 🛠️ 技術設計・実装方針 (Technical Notes / Design)

- **データモデル**:
  - `StockItem` エンティティに `barcode VARCHAR(32)` カラムを追加（Flyway V2 マイグレーション予定）。
- **コンポーネント**:
  - `frontend/src/components/scanner/BarcodeScannerModal.tsx`

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [ ] スマートフォンのカメラ映像から JAN コードが認識できること。
- [ ] 認識後に該当商品の編集または消費アクションへ遷移できること。
- [ ] カメラ非対応ブラウザでも手動入力にフォールバックすること。
- [ ] `npm run check` が全件合格すること。
