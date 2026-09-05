# [ADR-0007] OCI統合単一コンテナ/Single JARアーキテクチャへの移行および世帯マルチテナント基盤の導入

* **ステータス**: 承認済
* **日付**: 2026-09-05
* **決定者**: プロジェクトオーナー, 開発チーム

---

## 1. 文脈と問題提起 (Context)

当初の仕様（ADR-0001, ADR-0005）では、Cloudflare Pages による静的フロントエンド配信と OCI 上の Spring Boot バックエンド API の完全分離ホスティングを想定していた。
しかし、個人〜家庭向けの実運用フェーズを鑑みた際、以下の課題と過剰設計（Over-engineering）が顕在化した：

1. **CORSおよびオリジン管理の複雑性**:
   Cloudflare Pages と OCI でドメインが分かれることで CORS 設定やプレフライトリクエストが発生し、ネットワークオーバーヘッドとセキュリティ設定の二重管理が生じる。
2. **IntelliJ IDEA における開発者体験 (DX) の阻害**:
   リポジトリルート直下が Maven プロジェクトでない場合、IDEA がバックエンド構造を自動認識せず、手動インポートやモジュール設定の手間が発生する。
3. **OCI Always Free の余剰リソースの有効活用**:
   OCI Compute (Ampere A1 / 4 OCPU, 24GB RAM) は十分なスペックを有しており、Spring Boot 4 と React PWA 静的資産を同一の Docker コンテナ（Single JAR）で稼働させることが極めて容易かつコストゼロで実現可能である。
4. **家族共有・複数端末同期の拡張性**:
   単一ユーザー前提のテーブル構成では、後から家族間共有や複数世帯対応を行う際にスキーママイグレーションと破壊的変更が必要となる。

---

## 2. 決定内容 (Decision)

以下のアーキテクチャ刷新を正式採用する：

1. **OCI Consolidated Single JAR モノリス構成**:
   - リポジトリルートを標準 Maven プロジェクトとし、Spring Boot 4.0.8 を配置。
   - `frontend-maven-plugin` を活用し、`mvn package` 時に `frontend/` の Vite ビルド（React PWA）を自動実行して `target/classes/static/` に内包。
   - バックエンドとフロントエンドが同一オリジン（Port 8080）から配信され、CORS を本番環境において完全撤廃。
2. **SPA / PWA ルーティングフォールバック (`SpaWebMvcConfig`)**:
   - `WebMvcConfigurer` の `PathResourceResolver` を構成し、静的ファイルが存在しないクライアントルートルート（例: `/stocks`, `/shopping-list`）を自動的に `/index.html` にルーティング。API リクエスト（`/api/**`）や OpenAPI ドキュメント（`/v3/**`）との競合を完全に回避。
3. **世帯マルチテナント基盤 (`household_id`) の先行導入**:
   - Flyway マイグレーション `V1__init_schema.sql`、JPA エンティティ `StockItem`、DTO、リポジトリ、サービス層に `household_id` カラム（デフォルト `'default'`）を先行実装。
   - HTTP リクエストヘッダー `X-Household-Id` による透過的なデータ分離をサポートし、既存 API の後方互換性を保ちながら将来の家族共有・マルチ世帯化に即時対応。
4. **マルチステージ Dockerfile による最小コンテナ構築**:
   - ビルドステージ（`eclipse-temurin:21-jdk-alpine`）で Single JAR を生成し、実行ステージ（`eclipse-temurin:21-jre-alpine`）に JRE 実行環境と JAR のみを配置するセキュアな非 root 実行コンテナを標準化。

---

## 3. 結果・影響 (Consequences)

### メリット (Positive)
- **CORS ゼロ**: 単一オリジン配信により、ブラウザの CORS エラーやプレフライトリクエストのレイテンシを完全排除。
- **デプロイの極小化**: OCI 上で `docker compose up -d` を実行するだけで、DB・API・Web/PWA の全スタックが一発で起動。Cloudflare Pages のデプロイパイプライン管理が不要に。
- **優れた IDE サポート**: IntelliJ IDEA でリポジトリを開くだけで即座に Maven / Spring Boot 4 プロジェクトとして認識され、Run/Debug やテストがネイティブに動作。
- **家族共有へのスムーズな移行**: `household_id` が既にスキーマとビジネスロジックに組み込まれているため、認証機構（JWT/OAuth2等）追加時にデータモデルの破壊的変更が一切不要。

### デメリット・トレードオフ (Negative / Trade-offs)
- **フロントエンド更新時の再パッケージ**: フロントエンドのみの変更であっても、JAR の再ビルドおよび Docker イメージの再デプロイが必要（ただし、ローカル開発では Vite HMR プロキシにより即座にホットリロード可能）。
- **Cloudflare グローバルエッジキャッシュの不使用**: 静的ファイルが OCI 単一インスタンスから配信されるが、家庭内・日本国内利用であればミリ秒レベルの低遅延で動作し実用上の問題はない。

---

## 4. 代替案 (Alternatives Considered)

- **Cloudflare Pages + OCI 分離構成の維持**:
  無料枠の Pages を利用できる利点はあるが、個人開発〜家庭利用において2箇所のデプロイ管理、DNS 設定、CORS 設定の維持コストが過大であったため却下。
- **Next.js / Nuxt などのフルスタック Node.js フレームワーク**:
  Spring Boot 4 の堅牢なトランザクション管理、楽観的排他制御、Flyway による安全な DB マイグレーションのメリットを享受するため、Spring Boot 4 + React PWA の組み合わせを維持。
