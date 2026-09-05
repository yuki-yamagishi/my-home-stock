# [ADR-0001] フロントエンド／バックエンド完全分離型 BFF/API アーキテクチャの採用

* **ステータス**: 承認済
* **日付**: 2026-09-05
* **決定者**: MyHomeStock 開発チーム

---

## 1. 文脈と問題提起 (Context)
自宅在庫管理アプリ MyHomeStock は、モバイル端末（iOS/Android PWA）からの頻繁な在庫確認・数量更新や、将来的なデスクトップ・スマートスピーカー連携など、多様なクライアントからの利用が想定されます。モノリシックなサーバサイドレンダリング（Thymeleaf等）では、モバイル固有のオフライン対応や快適なSPA/PWA描画の実現が困難でした。

---

## 2. 決定内容 (Decision)
クライアント層（React + Vite）とサーバ層（Spring Boot 3 REST API）を完全に分離する **BFF/API アーキテクチャ** を採用します。両者間の通信は JSON をペイロードとする RESTful API（HTTPS）に統一します。

---

## 3. 結果・影響 (Consequences)

### メリット
- フロントエンドとバックエンドを個別にビルド・デプロイ可能（フロントは Cloudflare Pages、バックは OCI コンテナ）。
- クライアント側で PWA（Progressive Web App）のService Workerキャッシュを最大限に活用可能。
- OpenAPI スキーマを介した型同期により、安全な開発が可能。

### デメリット・トレードオフ
- CORS（Cross-Origin Resource Sharing）の設定および認証トークン・Cookie の適切なステートレス管理が必要。
