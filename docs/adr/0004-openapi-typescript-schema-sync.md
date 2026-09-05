# [ADR-0004] SpringDoc OpenAPI 3.0 と openapi-typescript による型自動同期

* **ステータス**: 承認済
* **日付**: 2026-09-05
* **決定者**: MyHomeStock 開発チーム

---

## 1. 文脈と問題提起 (Context)
フロントエンドとバックエンドが完全分離されている構成では、バックエンドの DTO のプロパティ追加・変更時に、フロントエンド側の TypeScript 型を手動修正していると、修正漏れ・不一致による実行時エラー（TypeError）が発生しやすくなります。

---

## 2. 決定内容 (Decision)
**SpringDoc OpenAPI 3.0 + openapi-typescript** による型自動同期パイプラインを採用します。
1. バックエンドで SpringDoc がコントローラー・DTO から OpenAPI 3.0 仕様（JSON）を自動生成。
2. `npm run sync-api` (`scripts/syncApi.js`) を実行すると、スキーマから `frontend/src/api/schema.d.ts` がミリ秒単位で生成される。
3. CI パイプラインおよび `npm run check` の型検査（`tsc --noEmit`）で型破壊を機械的にブロック。

---

## 3. 結果・影響 (Consequences)

### メリット
- バックエンドの API 変更が即座にフロントエンドのコンパイルエラーとして可視化され、手戻りがゼロに。
- Swagger UI (`/swagger-ui.html`) により、開発中の API 動作検証が容易。

### デメリット・トレードオフ
- バックエンドの DTO に OpenAPI 用のアノテーション（`@Schema`）を適切に付与する規約が必要。
