# [ADR-0005] Docker によるローカル PostgreSQL 環境と OCI / Cloudflare デプロイ

* **ステータス**: 承認済
* **日付**: 2026-09-05
* **決定者**: MyHomeStock 開発チーム

---

## 1. 文脈と問題提起 (Context)
ローカル開発時に各開発者のホスト OS に PostgreSQL を直接インストールすると、バージョン不一致やデータ汚染が発生します。また、本番環境の維持コストを最小限（完全無料）に抑えつつ、安定した本番稼働インフラを確保する必要があります。

---

## 2. 決定内容 (Decision)
1. **ローカル DB**: `docker-compose.yml` で PostgreSQL 16 コンテナを提供。ホスト環境を汚さず `npm run db:up` / `db:down` で一括管理。
2. **本番バックエンド**: Oracle Cloud Infrastructure (OCI) Always Free (ARM Ampere A1 4コア/24GBメモリ) 上で Multi-stage build Dockerfile (Temurin 21 JRE) によるコンテナ稼働。
3. **本番フロントエンド**: Cloudflare Pages（または Vercel）による静的配信。完全無料枠で HTTPS、エッジ CDN、PWA をサポート。

---

## 3. 結果・影響 (Consequences)

### メリット
- ホスト PC に DB を直接インストール不要で、新規開発者のセットアップが1分で完了。
- 永年無料のクラウドインフラ構成により、運用コストが完全0円。

### デメリット・トレードオフ
- OCI の初期コンピュートインスタンス設定および Docker デプロイ設定が必要。
