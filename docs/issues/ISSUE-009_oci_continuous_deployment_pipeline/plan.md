# 実装計画書 (Implementation Plan) - ISSUE-009

- **対象Issue**: [ISSUE-009] OCI Always Free 向け GitHub Actions イミュータブル継続的デプロイ（CD）パイプラインの構築
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-15

---

## 1. 変更ファイル一覧

### 新規追加
1. [`Dockerfile.prod`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/Dockerfile.prod): OCI 本番専用の軽量 Single JAR コンテナ定義（`eclipse-temurin:21-jre-alpine`、非 root 実行、事前ビルド済み JAR の直接 COPY）
2. [`docker-compose.prod.yml`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/docker-compose.prod.yml): OCI Always Free 本番スタック定義（GHCR コンテナイメージ、PostgreSQL 16、Watchtower による Pull 型安全更新、ヘルスチェック連動）
3. [`.github/workflows/deploy.yml`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/.github/workflows/deploy.yml): `main` ブランチへの push をトリガーとする CD ワークフロー（品質・テストジョブ通過検証、Native Single JAR パッケージング、Docker Buildx による ARM64 ビルド、GHCR push、古いイメージの自動パージ）
4. [`docs/adr/0011-oci-continuous-deployment-ghcr.md`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/docs/adr/0011-oci-continuous-deployment-ghcr.md): イミュータブル CD パイプラインおよび Pull 型デプロイの設計決定記録

### 変更
1. [`docs/adr/README.md`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/docs/adr/README.md): ADR-0011 のインデックス登録
2. [`docs/issues/README.md`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/docs/issues/README.md): ISSUE-009 ステータス更新

---

## 2. 実装ステップ

### ステップ 1: 本番専用コンテナ定義 (`Dockerfile.prod`) の作成
- `eclipse-temurin:21-jre-alpine` をベースイメージに採用。
- `curl` または `wget` をインストール（ヘルスチェック用）。
- セキュアな非 root 実行用ユーザー `spring` (`UID/GID 10001`) の作成。
- GitHub Actions の Native ビルドで生成された `target/*.jar` を `app.jar` として `COPY`。
- ポート 8080 を `EXPOSE` し、`ENTRYPOINT ["java", "-jar", "/app/app.jar"]` を設定。
- ※ 既存のローカル用 [`Dockerfile`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/Dockerfile) は一切変更せず、既存の DX（`docker-compose.yml`）を保護。

### ステップ 2: OCI 本番用スタック定義 (`docker-compose.prod.yml`) の作成
- `app` サービス:
  - イメージ: `ghcr.io/yuki-yamagishi/myhomestock:latest`
  - ラベル: `com.centurylinklabs.watchtower.enable: "true"`（Watchtower 監視対象指定）
  - ヘルスチェック: `wget -qO- http://localhost:8080/api/v1/health || exit 1`
  - ポート: `8080:8080`
  - 環境変数: PostgreSQL 接続情報、Google OAuth2 認証情報
- `postgres` サービス:
  - `postgres:16-alpine`
  - 外部ネットワークへのポート公開なし（内部ネットワーク `default` 経由）
  - ボリューム: `postgres_data:/var/lib/postgresql/data`
- `watchtower` サービス:
  - `containrrr/watchtower`
  - オプション: `--interval 300`（5分間隔）、`--label-enable`（DB コンテナ除外）、`--cleanup`（古いコンテナ削除）
  - Docker ソケットマウント: `/var/run/docker.sock:/var/run/docker.sock`

### ステップ 3: GitHub Actions CD ワークフロー (`deploy.yml`) の作成
- トリガー: `push` on `main` / `master`
- 権限設定: `contents: read`, `packages: write`
- ジョブ構成:
  - **1. ci-verification**: セキュリティガード、Spring Boot テスト全件、フロントエンド型検査・テスト・ビルドの完全通過を保証。
  - **2. build-and-deploy**: `needs: [ci-verification]`
    - `actions/setup-java@v5` (Java 21, temurin)
    - `actions/setup-node@v4` (Node 22)
    - Native Maven パッケージング: `./mvnw clean package -DskipTests`（Vite ビルド内包 Single JAR 生成、x86_64 ネイティブで超高速実行）
    - Docker セットアップ: `docker/setup-qemu-action@v3`, `docker/setup-buildx-action@v3`
    - GHCR ログイン: `docker/login-action@v3` with `secrets.GITHUB_TOKEN`
    - Docker Build & Push: `platforms: linux/arm64`, `file: Dockerfile.prod`, `tags: ghcr.io/${{ github.repository }}:latest,ghcr.io/${{ github.repository }}:sha-${{ github.sha }}`
  - **3. cleanup-old-images**:
    - `actions/delete-package-versions@v5` を用いて、直近 5 バージョンおよび `latest` を保護しつつ古いタグを自動削除。

### ステップ 4: ADR-0011 の作成とインデックス登録
- `docs/adr/0011-oci-continuous-deployment-ghcr.md` を作成。
- なぜ本番サーバー上ビルド（アンチパターン）を排除し、GHCR 経由のイミュータブルデプロイを採用したのか（Why/Decision/Consequences/QEMU回避/Watchtower）を不変記録として明文化。
- `docs/adr/README.md` に登録。

### ステップ 5: 品質検証 & 成果物レビュー
- `npm run check` によるドキュメント整合性・シークレット漏洩・型同期・フロントエンドテスト・ビルドのワンショット検証。
- `./mvnw test` によるバックエンドテスト全件通過の検証。
