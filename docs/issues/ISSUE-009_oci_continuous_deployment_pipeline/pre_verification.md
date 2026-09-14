# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-009

- **対象Issue**: [ISSUE-009] OCI Always Free 向け GitHub Actions イミュータブル継続的デプロイ（CD）パイプラインの構築
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-15

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **CPU アーキテクチャの差異**: GitHub Actions の無料 Runner は `linux/amd64` (x86_64) であり、OCI Always Free (Ampere A1) は `linux/arm64` (aarch64) である。QEMU エミュレーションによる Docker 内 Maven/Vite フルビルドは 15〜20 分以上を要する致命的ボトルネックとなる。
  - **解決策**: Single JAR 生成（Maven + Vite）は x86_64 ネイティブランナー上で高速実行（OS/CPU ニュートラル）。コンテナ化のみ ARM64 向けに `Dockerfile.prod` で事前ビルド済み Single JAR を `COPY` することで、エミュレーションコンパイルをゼロにし、全工程 10 分以内のデプロイを実現する。
- **ネットワークセキュリティ制約**: GitHub Actions の動的 IP に対して OCI のインバウンド SSH（22番ポート）を全世界（`0.0.0.0/0`）に開放することは深刻な攻撃対象面の拡大を招く。
  - **解決策**: OCI 側から GHCR へ外向き（Outbound HTTPS: 443）の通信のみでイメージ更新を検知・取得する **Pull 型デプロイ（Watchtower）** を採用し、SSH ポートのインターネット開放を一切不要にする。

### 1.2. UX・エッジケース
- **コンテナ再起動時の瞬断（ダウンタイム）**: コンテナ再起動中に Spring Boot が初期化されるまでの間、アクセスが途絶する。
  - **対策**: MyHomeStock は既に Service Worker によるオフラインキャッシュを備えているため、一時的な瞬断が発生してもフロントエンド画面が白画面になることは防げる。また、Docker ヘルスチェック（`/api/v1/health`）により健全性が確認されるまで監視を行う。
- **DB 巻き込み再起動**: Watchtower が PostgreSQL コンテナまで検知して再起動すると、データ書き込み中のトランザクション切断を招く。
  - **対策**: `app` コンテナにのみ `com.centurylinklabs.watchtower.enable: "true"` を付与し、Watchtower 側で `--label-enable` を指定して DB コンテナを物理的に監視対象外とする。

### 1.3. データ永続性・互換性
- **PostgreSQL 永続化**: `docker-compose.prod.yml` において名前付きボリューム `postgres_data` を指定し、コンテナ更新時も DB データが 100% 保持されることを保証。
- **Flyway マイグレーション互換性**: 新イメージ起動時に Flyway によるマイグレーションが自動実行されるため、後方互換性を破壊しないマイグレーション設計（Expand & Contract パターン）を厳守する。

### 1.4. テスト自律性
- **安全クオリティゲート**: `deploy.yml` は CI ジョブ（`quality-gate`, `backend`, `frontend`）が全パスした場合のみ実行される（`needs: [quality-gate, backend, frontend]`）。テストや型検査が 1 つでも失敗した場合は CD ジョブが機械的に抑止され、壊れたイメージが GHCR に公開される事故を防ぐ。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **既存 `Dockerfile`**: ローカル環境の `docker-compose.yml` で使われており、コンテナ内でビルドを完結させる Multi-stage build。これを改変するとローカルの `docker compose up -d --build` でホスト側に JAR がない場合にビルドが壊れるため、既存 `Dockerfile` は一切変更せず維持する。
- **既存ヘルスチェック**: `src/main/java/com/myhomestock/controller/HealthController.java` にて `/api/v1/health` が既に実装されており、DB 疎通確認も備えている。未導入の `spring-boot-starter-actuator` を追加して二重管理にするのではなく、既存の `/api/v1/health` を本番ヘルスチェックとして正式採用する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- 独自スクリプトによる複雑な SSH リモート実行やデプロイ用の独自シェルスクリプトを組むのではなく、業界標準の公式 GitHub Actions (`docker/setup-buildx-action`, `docker/build-push-action`, `actions/cache`) および実務実績のある `containrrr/watchtower` を採用し、保守性と運用の再現性を極大化する。
