# MyHomeStock ドメイン不変則 & アーキテクチャ制約 (Domain Constraints)

本ドキュメントは、**MyHomeStock** アプリケーションの健全性、データ整合性、および保守性を永久に担保するための **不変のドメイン制約（Invariant Domain Rules）** です。
すべてのコード生成・編集・リファクタリングにおいて、エージェントは以下の原則を例外なく遵守しなければなりません。

---

## 1. JPA 楽観的排他制御の厳守 (@Version & Optimistic Locking)
- **原則**: 自宅在庫や買い物リストは複数端末・家族間で同時に更新される可能性があります。
- **制約**:
  1. すべてのミュータブルな JPA エンティティ（`StockItem` 等）には `@Version private Long version;` を付与すること。
  2. 更新用 Request DTO（`StockItemRequestDto` 等）には必ず `version` フィールドを含めること。
  3. サービス層での更新処理において、クライアントから渡された `version` と DB 上の `version` の不一致を検知し、`OptimisticLockingFailureException`（HTTP 409 Conflict）をスローすること。
  4. 楽観ロック競合が発生した場合、フロントエンド（TanStack Query）は最新データを再取得（`invalidateQueries`）し、ユーザーに競合ダイアログを明示すること。

---

## 2. 世帯マルチテナントの完全分離 (household_id Separation)
- **原則**: ユーザーデータは世帯（`household_id`）単位で厳格に分離され、他世帯のデータが混入・漏洩してはなりません。
- **制約**:
  1. エンティティは `household_id` カラムを持ち、適切なインデックス（`(household_id, category, name)` 等）を付与すること。
  2. Spring Data JPA リポジトリのすべての検索・集計クエリは `household_id` を必須パラメータとして受け取ること（例: `findByHouseholdIdOrderByCategoryAscNameAsc`）。
  3. 更新・削除処理時は、対象レコードの `household_id` がリクエスト元の世帯 ID と一致することをサービス層で物理検証すること。

---

## 3. 純粋コアロジックの不可侵 (Pure Core Logic Independence)
- **原則**: 在庫不足判定、賞味期限ステータス計算、並び替え等のビジネスロジックは、UI フレームワークやブラウザ API から完全に独立していなければなりません。
- **制約**:
  1. `frontend/src/core/` 配下の純粋関数は、React フック（`useState`, `useEffect` 等）、DOM API（`document`, `window` 等）、ブラウザ固有ストレージを直接インポートしてはならない。
  2. コアロジックは純粋関数（Input -> Output）として実装し、UI やモックなしで Vitest による単体テスト網羅率 100% を維持すること。
  3. 日付や時間は引数として外部から注入（Dependency Injection）可能とし、システム時計依存のテスト不安定性を排除すること。

---

## 4. OpenAPI 3.0 型安全バインド原則 (Contract-First / Type-Safe Binding)
- **原則**: バックエンド API とフロントエンドクライアントは、OpenAPI スキーマを通じて 100% 型安全に同期されていなければなりません。
- **制約**:
  1. バックエンドの REST コントローラーや DTO を変更した際は、必ず `docs/openapi.json` を更新し、`npm run sync-api` で `frontend/src/api/schema.d.ts` を再生成すること。
  2. フロントエンドコード内で `any` 型による API レスポンスの受け取りや、手動での型定義の二重作成を行ってはならない。必ず `schema.d.ts` 由来の型を使用すること。
