# [ADR-0014] CORS 設定の厳格化（ワイルドカード排除）および SPA Cookie セッションに対する CSRF 保護アーキテクチャ

* **ステータス**: 承認済
* **日付**: 2026-10-03
* **決定者**: MyHomeStock 開発チーム

---

## 1. 文脈と問題提起 (Context)

MyHomeStock は、Spring Boot 4 バックエンドと React SPA フロントエンドから構成され、OCI 単一コンテナ / Single JAR アーキテクチャで稼働しています。認証方式には Google OAuth2 による認証と `JSESSIONID`（Cookie）を用いたステートフルセッション管理を採用しています。

しかしながら、以下の 2 点において重大なセキュリティリスクが存在していました：
1. **CORS 設定におけるワイルドカード許可**:
   `SecurityConfig.java` において `https://*.duckdns.org` がワイルドカードで許可され、かつ `allowCredentials(true)` が有効になっていました。DuckDNS は何者でも任意のサブドメインを取得できる動的 DNS サービスであるため、悪意ある第三者が立ち上げたドメインから被害者のブラウザを通じてセッション Cookie 付きで API が呼び出され、世帯や在庫データが漏洩するリスクがありました。
2. **Cookie セッションに対する CSRF 保護の無効化**:
   `SecurityConfig.java` において `.csrf(AbstractHttpConfigurer::disable)` と設定されていました。Cookie によるステートフル認証では、ブラウザがクロスサイトリクエスト時にも自動的に Cookie を送信する仕様があるため、悪意ある外部 Web サイトからの意図しない在庫データ削除・更新や世帯乗っ取りといった CSRF 攻撃に対して無防備でした。

---

## 2. 決定内容 (Decision)

### 2.1. CORS 設定の外部化とワイルドカード完全排除
- 不特定多数が共有する `https://*.duckdns.org` などのワイルドカード指定を完全に撤廃します。
- `application.yml` の `app.cors.allowed-origins` プロパティ（環境変数 `CORS_ALLOWED_ORIGINS`）として外部設定化します。
- デフォルト設定ではローカル開発環境（`http://localhost:*`, `http://127.0.0.1:*`）のみを許可し、本番環境では自身が管理する特定の完全修飾ドメイン名（FQDN）のみをピンポイントで設定するホワイトリスト方式とします。

### 2.2. Spring Security 6 標準の SPA CSRF 保護アーキテクチャの導入
- **`CookieCsrfTokenRepository.withHttpOnlyFalse()` の採用**:
  CSRF トークンを `XSRF-TOKEN` Cookie（`HttpOnly: false`, `Path: /`, `SameSite: Lax`）として発行し、SPA の JavaScript から読み取れるようにします。
- **`SpaCsrfTokenRequestHandler` の導入**:
  Spring Security 6 の BREACH 攻撃対策（`XorCsrfTokenRequestAttributeHandler`）と SPA クライアントによる平文ヘッダー（`X-XSRF-TOKEN`）の両立を担保する標準ハンドラを採用します。
- **`CsrfCookieFilter` の登録**:
  Spring Security 6 で遅延ロードされる `CsrfToken` を確実にレスポンス Cookie に書き込むため、認証フィルター直後にトークン解決を行う `CsrfCookieFilter`（`OncePerRequestFilter`）を配置します。
- **フロントエンドクライアント（`client.ts`）の中央集権的ヘッダー付与**:
  `document.cookie` から `XSRF-TOKEN` を自動抽出し、状態変更リクエスト（POST, PUT, DELETE, PATCH）およびログアウト処理時に `X-XSRF-TOKEN` ヘッダーを自動付加します。

---

## 3. 結果・影響 (Consequences)

### メリット (Positive)
- **クロスオリジン情報漏洩の防止**: 不正な第三者 DuckDNS ドメインからの認証付きアクセスが物理的に遮断されます。
- **CSRF 攻撃の完全防御**: 悪意ある外部サイトからの偽造リクエストが HTTP 403 Forbidden で即座に拒絶され、在庫データや世帯の保全性が担保されます。
- **シームレスな UX**: クライアントライブラリが Cookie から自動でトークンを抽出して送信するため、エンドユーザーの操作性や画面表示には一切影響を与えません。

### デメリット・トレードオフ (Negative / Trade-offs)
- **テストコードでの考慮が必要**: コントローラーの統合テストにおいて、状態変更リクエストに `with(csrf())` を付与する必要があります。
- **環境変数の管理**: 本番環境で DuckDNS ドメイン等を使用する場合、`CORS_ALLOWED_ORIGINS` を明示的に設定する必要があります。

---

## 4. 代替案 (Alternatives Considered)

1. **SameSite=Strict Cookie のみに依存する案**:
   - 一部の古いブラウザやトップレベルナビゲーションの挙動により、CSRF の完全な防御策とはならず、OWASP ガイドラインでも Cookie 認証にはトークンベースの CSRF 対策が必須とされています。
2. **トークン不要の JWT / Bearer トークン認証への全面移行**:
   - 今回のスコープを超える大規模な認証アーキテクチャの改修となり、Single JAR / セッションベースの現行設計とのトレードオフが大きいため採用しませんでした。
