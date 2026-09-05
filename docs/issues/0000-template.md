# [ISSUE-XXXX] タイトル

> [!NOTE]
> 各 Issue は独立したフォルダ `docs/issues/ISSUE-XXX_<title>/` を作成し、本テンプレートを `issue.md` として配置します。
> ライフサイクルを通じて以下の 4 ドキュメントを管理・維持してください：
> 1. `issue.md`（本仕様書）
> 2. `pre_verification.md`（4軸事前検証ログ）
> 3. `plan.md`（実装計画書）
> 4. `walkthrough.md`（成果レポート・レビュー対応履歴）

* **ステータス**: 🟡 `status: backlog` / 🟠 `status: todo` / 🔵 `status: ready` / 🟣 `status: in-progress` / ✅ `status: closed`
* **種別**: 🟢 `type: feature` / 🔴 `type: bug` / 🟡 `type: refactor` / 🧪 `type: test` / 🤖 `type: harness` / 🚀 `type: ci` / 📘 `type: docs`
* **担当者**: 未定 / AIエージェント / ユーザー名
* **作成日**: YYYY-MM-DD
* **関連 ADR / PR**: 

---

## 📌 課題の概要・背景 (Problem Description / Context)

どのような課題やユーザーニーズがあるのか、なぜこの改修・機能が必要なのかを簡潔に記述します。

---

## 🎯 要件定義 (Requirements)

1. **要件 1**: 
2. **要件 2**: 
3. **要件 3**: 

---

## 🛠️ 技術設計・実装方針 (Technical Notes / Design)

- **影響範囲**: フロントエンド (`frontend/src/...`) / バックエンド (`src/main/...`) / DB / ドキュメント
- **データモデル・API**: 

---

## ✅ 受け入れ基準 (Acceptance Criteria)

- [ ] 受け入れ基準 1
- [ ] 受け入れ基準 2
- [ ] 自動テスト（単体・結合テスト）が作成され PASS していること
- [ ] `npm run check` が正常に合格すること
