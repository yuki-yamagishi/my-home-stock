# 実装成果レポート (Walkthrough) - ISSUE-009

- **対象Issue**: [ISSUE-009] OCI Always Free 向け GitHub Actions イミュータブル継続的デプロイ（CD）パイプラインの構築
- **ステータス**: 🟢 完了 (`status: completed`)
- **作成日**: 2026-09-15

---

## 1. 成果サマリー

`main` ブランチへのマージを契機として自動起動し、GitHub Container Registry (GHCR) を介して OCI Always Free へイミュータブル（再現可能・不変）にデプロイする **完全自動継続的デプロイ（CD）パイプライン** を構築しました。

### 主要な成果と設計判断
1. **本番専用軽量 Single-Stage コンテナ定義 ([`Dockerfile.prod`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/Dockerfile.prod)) の新設**:
   - Single JAR（Maven + Vite 内包）の生成は GitHub Actions の x86_64 ネイティブランナー上で高速実行。
   - `Dockerfile.prod` では事前ビルド済み JAR を `eclipse-temurin:21-jre-alpine` に直接 `COPY` して ARM64 コンテナ化を行うことで、**QEMU エミュレーションによるビルド遅延（15〜20分）を完全排除し、全デプロイ工程を数分で完了** させます。
   - ローカル開発用の自己完結型 [`Dockerfile`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/Dockerfile) は一切変更せず、既存の開発者体験（DX）を保護。
2. **高セキュリティ Pull 型デプロイ基盤 ([`docker-compose.prod.yml`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/docker-compose.prod.yml)) の構築**:
   - OCI 側で **Watchtower** を常駐運用し、外向き（Outbound HTTPS: 443）の通信のみでイメージ更新を検知・再起動。
   - **OCI の SSH インバウンドポート（22番）をインターネットに一切公開する必要がなくなり、最高強度の境界防御を実現**。
   - `com.centurylinklabs.watchtower.enable: "true"` および `--label-enable` を指定し、同一 compose 内の PostgreSQL コンテナの誤再起動・データ破損を物理防止。
   - 既存の堅牢なヘルスチェックエンドポイント [`/api/v1/health`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/src/main/java/com/myhomestock/controller/HealthController.java) と連動。
3. **CD ワークフロー ([`.github/workflows/deploy.yml`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/.github/workflows/deploy.yml)) の新設**:
   - `main` push 時にトリガーされ、CI 品質ゲート全件（テスト・型検査・セキュリティガード）が 100% PASS した場合のみデプロイを実行する安全依存関係（`needs: [ci-verification]`）。
   - `actions/delete-package-versions` による古い GHCR イメージの自動パージ（`latest` および直近 5 バージョンを保護保持）。
4. **設計決定記録 ([`ADR-0011`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/docs/adr/0011-oci-continuous-deployment-ghcr.md)) の採択**:
   - 本番サーバー上ビルド（アンチパターン）の排除理由、QEMU ボトルネック回避、Pull 型デプロイの正当性を不変の設計記録として明文化。

---

## 2. 検証結果

### 2.1. ドキュメント・アーキテクチャ整合性検証 (`npm.cmd run check:docs`)
- **結果**: ✅ **PASS**
  - プラグインおよび Submodule 配備状況: 正常展開確認済
  - ADR 登録整合性: 全 11 件（ADR-0001〜0011）の採番・登録確認済
  - Issue 4ドキュメント完結性: 全 9 件の整合性確認済
  - OpenAPI 仕様書型同期: `docs/openapi.json` & `frontend/src/api/schema.d.ts` 整合確認済

### 2.2. TypeScript Strict 型検査 (`npm.cmd --prefix frontend run type-check`)
- **結果**: ✅ **PASS** (エラー 0 件)

### 2.3. フロントエンド単体テスト (`npm.cmd --prefix frontend run test:run`)
- **結果**: ✅ **PASS** (12 tests PASS)

### 2.4. バックエンド単体・統合テスト (`.\mvnw.cmd test`)
- **結果**: ✅ **PASS** (8 tests PASS, H2 インメモリ DB 結合確認)

---

## 3. レビュー指摘事項と改善対応履歴 (Review Feedback & Iterations)

| 重要度 | 指摘・改善提案 | 対応内容 | 反映ファイル |
| :--- | :--- | :--- | :--- |
| `[must]` | Dockerfile 構造およびローカル開発環境との整合性の未定義（QEMU 遅延回避と既存 DX 保護の両立） | 本番専用に `Dockerfile.prod` を新設し、事前ビルド済み Single JAR を直接 COPY する方針を策定・実装。既存 `Dockerfile` は一切変更せず保護。 | `issue.md`, `plan.md`, `Dockerfile.prod` |
| `[must]` | ヘルスチェックエンドポイント（Actuator vs `/api/v1/health`）の仕様矛盾 | 未導入の Actuator ではなく、既存の堅牢な `/api/v1/health`（DB 疎通確認を含む）を本番ヘルスチェックとして正式採用し矛盾を解消。 | `issue.md`, `plan.md`, `docker-compose.prod.yml` |
| `[must]` | 受け入れ基準（DoD）における Given-When-Then シナリオおよび境界値・異常系の完全欠落 | 4つの客観的検証シナリオ（正常系CD、CI失敗時CD抑止、Watchtower反映・DB巻き込み防止、GHCR自動パージ）を正式策定。 | `issue.md`, `plan.md` |
| `[should]` | Watchtower による DB コンテナ巻き込み再起動リスクおよび GHCR 認証 | `app` コンテナのみに `com.centurylinklabs.watchtower.enable=true` を付与し、Watchtower 側で `--label-enable` を指定して DB コンテナを物理除外。 | `issue.md`, `plan.md`, `docker-compose.prod.yml` |
| `[should]` | GHCR 自動パージの権限（`packages: write`）と保持ルールの確定 | ワークフロー権限に `packages: write` を明記し、`latest` および直近 5 バージョンを恒久保護する確定値を設定・実装。 | `issue.md`, `plan.md`, `deploy.yml` |
| `[imo]` | フロントエンドビルドと Maven パッケージングのキャッシュ最適化 | `actions/cache` により Maven 依存関係および Node.js キャッシュを活用し、全工程 10分以内の完了を確実化。 | `plan.md`, `deploy.yml` |
| `[must]` | `docker-compose.prod.yml` で Caddy サービスが誤削除されポート 8080 が生公開されていた（HTTPS 喪失による OAuth2/Cookie secure/世帯認可機能不全リスク） | Caddy サービスを完全復元し、ポート 80/443 をバインド。生ポート 8080 をホスト非公開（`expose: 8080`）に隠蔽し、Watchtower 除外ラベルを付与。 | `docker-compose.prod.yml`, `plan.md` |
| `[should]` | `deploy.yml` に並行実行制御（`concurrency`）が未設定のため、連続 push / マージ時に `latest` タグが競合上書きされるリスク | `concurrency: { group: cd-deploy, cancel-in-progress: false }` をトップレベルに追加し順次実行を保証。 | `.github/workflows/deploy.yml` |
| `[should]` | `Dockerfile.prod` で `COPY` と `RUN chown` が分離しており、レイヤー二重化によりイメージサイズが肥大化 | `COPY --chown=appuser:appgroup ${JAR_FILE} app.jar` に統合し、単一レイヤー化。HEALTHCHECK に `--start-period=20s` を付与。 | `Dockerfile.prod` |
| `[should]` | `deploy.yml` のパッケージ名ハードコード | `package-name: ${{ github.event.repository.name }}` に変数化。 | `.github/workflows/deploy.yml` |
