## 📌 概要 / 関連 Issue
Closes #<!-- 関連する Issue 番号を記載してください。例: Closes #1 -->

<!-- 本 PR で行った変更の要約を簡潔に記載してください -->

---

## 📚 関連ドキュメント・検証ログ (docs/)
- **事前検証ログ**: `docs/pre_phase_verification.md`
- **実装計画書**: `docs/implementation_plan.md`
- **成果レポート**: `docs/walkthrough.md`
- **設計決定記録 (ADR)**: `docs/adr/` (新規追加・更新がある場合はファイル名を記載)

---

## 🎯 変更内容の詳細
- [ ] 
- [ ] 

---

## 🛡️ 品質 & セキュリティ検証チェックリスト
PR 作成前にローカル環境で検証を完了させてください：

- [ ] **シークレットスキャン**: `node scripts/securityCheck.js` (PASS)
- [ ] **ドキュメント整合性**: `node scripts/docCheck.js` (PASS)
- [ ] **TypeScript 型検査**: `npm --prefix frontend run type-check` (PASS)
- [ ] **フロントエンドテスト**: `npm --prefix frontend run test:run` (PASS)
- [ ] **プロダクションビルド**: `npm --prefix frontend run build` (PASS)
- [ ] **バックエンドテスト**: `.\mvnw.cmd test` (全件 PASS)
- [ ] **ワンショット一括検査**: `npm run check` (全件合格)

---

## 🔍 レビュー時の注目ポイント (Review Points)
<!-- レビュアーが特に重点的に確認すべき差分や設計上の工夫があれば記載してください -->
- 

---

## 🤖 Fleet レビュー & 承認ルール
- 本 PR 作成後、独立レビューサブエージェント（Fleet Reviewer）による自動コードレビューを実施してください。
- レビューコメントは **Conventional Comments** 形式（`[must]`, `[should]`, `[imo]`, `[nits]`, `[ask]`）で付与されます。
- **自動マージ禁止**: `[must]` 指摘の解消および人間開発者による明示的なレビュー・承認を経てマージしてください。
