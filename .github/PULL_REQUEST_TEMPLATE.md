## 概要 (Summary)
<!-- 変更の概要と目的を簡潔に記載してください -->

Closes #<!-- Issue番号を記載 -->

---

## 変更内容 (Changes)
<!-- 実施した変更を箇条書きで記載してください -->
- 
- 

---

## 設計決定・ADRリンク (Architecture Decisions)
<!-- 新しい技術選定やアーキテクチャ変更がある場合、作成した ADR のリンクを記載してください -->
- [ ] 該当なし
- [ ] ADR 作成済: `docs/adr/000X-....md`

---

## 品質・検証チェックリスト (Quality Checklist)
- [ ] シークレットスキャン合格 (`node scripts/securityCheck.js`)
- [ ] ドキュメント整合性検査合格 (`node scripts/docCheck.js`)
- [ ] フロントエンド型検査合格 (`npm --prefix frontend run type-check`)
- [ ] フロントエンド単体テスト合格 (`npm --prefix frontend run test:run`)
- [ ] フロントエンド本番ビルド合格 (`npm --prefix frontend run build`)
- [ ] バックエンド単体テスト合格 (`cd backend && .\mvnw.cmd test`)
- [ ] ワンショット品質ゲート全件合格 (`npm run check`)
