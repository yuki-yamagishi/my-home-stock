# [ISSUE-028] CORS オリジン厳格化（DuckDNS ワイルドカード排除）および Cookie セッションに対する CSRF 保護の導入

* **ステータス**: 🟣 `status: in-progress`
* **種別**: 🛡️ `type: security` / 🟢 `type: feature`
* **担当者**: AIエージェント
* **作成日**: 2026-10-03
* **関連 GitHub Issue / PR**: [GitHub Issue #28](https://github.com/yuki-yamagishi/my-home-stock/issues/28) / ADR-0014

---

## 1. 解決すべき課題・背景 (Why)

1. **CORS ワイルドカード許可に伴う認証情報窃取リスク**:
   - `SecurityConfig.java` において、`allowedOriginPatterns` に `"https://*.duckdns.org"` が登録され、かつ `allowCredentials(true)` が有効化されている。
   - DuckDNS は何者でも任意のサブドメインを無償・即座に取得できる動的DNSサービスである。
   - 悪意ある第三者が攻撃用ドメイン（例: `https://attacker.duckdns.org`）を作成した場合、被害者がそのページを訪問すると、被害者のブラウザに保持された `JSESSIONID` Cookie を添付して MyHomeStock の API を呼び出すことができ、世帯情報や在庫一覧などの認証必須レスポンスが攻撃者に漏洩する。
   - したがって、不特定多数が共有するワイルドカードを即座に排除し、明示的に許可されたオリジンのみを受け入れる設定へ刷新する必要がある。

2. **Cookie セッションに対する CSRF 対策の欠落（絶対必須）**:
   - `SecurityConfig.java` において、`.csrf(AbstractHttpConfigurer::disable)` と設定されており、CSRF（Cross-Site Request Forgery）保護が完全に無効化されている。
   - MyHomeStock は `JSESSIONID`（Cookie）を用いたステートフル認証を採用している。
   - Cookie はブラウザから同一オリジン・クロスオリジン問わず自動送信される仕様であるため、CSRF 対策が欠落している場合、ログイン済みユーザーが悪意ある外部サイト（罠ページ）を閲覧した際に、外部サイト上のスクリプトや HTML フォームから MyHomeStock の状態変更 API（`/api/v1/stocks`, `/api/v1/households/members` 等）に対して副作用を持つリクエストが送信され、自動的に実行されてしまう。
   - これにより、在庫アイテムの不正削除、在庫数量の不正書き換え、不正な世帯メンバー招待といった深刻な改ざん・破壊が引き起こされる。
   - したがって、ステートフル認証を採用している以上、Spring Security 6 標準の SPA CSRF 保護アーキテクチャの導入は絶対必須である。

---

## 2. 排除するリスク (Risks to Eliminate)

1. **悪意ある第三者ドメインからのクロスオリジン認証リクエストによる情報漏洩リスク排除**:
   - `https://*.duckdns.org` のワイルドカードを完全撤廃し、環境変数または設定プロパティで明示されたオリジン（ローカル開発環境 `http://localhost:*`, `http://127.0.0.1:*` および本番運用時に指定される固定ドメイン）のみを許可する。
2. **CSRF 攻撃によるデータ改ざん・削除・世帯乗っ取りリスク排除**:
   - 状態変更リクエスト（POST, PUT, DELETE, PATCH）に対して CSRF トークン（`X-XSRF-TOKEN` ヘッダー）の検証を物理強制し、トークンが欠落または不正なリクエストを HTTP 403 Forbidden で即座に遮断する。
3. **SPA における CSRF トークン未取得による正規リクエスト遮断リスク排除**:
   - Spring Security 6 推奨の SPA CSRF パターン（`CookieCsrfTokenRepository.withHttpOnlyFalse()` + `SpaCsrfTokenRequestHandler` + `CsrfCookieFilter`）を採用し、クライアント（`client.ts`）で Cookie `XSRF-TOKEN` を自動抽出してリクエストヘッダーに自動付与することで、正規 SPA 操作の透過性を保証する。
4. **公開・認証エンドポイントにおける不要な CSRF 遮断リスク排除**:
   - GET メソッドのリクエスト、および OAuth2 ログイン・コールバック、公開静的ファイル、ヘルスチェック（`/api/v1/health`）等の CSRF 対象外エンドポイントを正確に整理し、通常利用における誤遮断を防止する。

---

## 3. 受け入れ基準 (Acceptance Criteria / DoD)

- [x] CORS 設定から `https://*.duckdns.org` のワイルドカードが完全に排除されていること。
- [x] 許可オリジンが `app.cors.allowed-origins`（環境変数 `CORS_ALLOWED_ORIGINS`）として外部設定化され、デフォルトはローカル開発環境（`http://localhost:*`, `http://127.0.0.1:*`）のみとなっていること。
- [x] 許可されていないオリジン（例: `https://attacker.duckdns.org`）からの CORS プリフライトおよびリクエストが拒絶されること。
- [x] バックエンドで CSRF 保護が有効化され、初回アクセス時および認証後に `XSRF-TOKEN` Cookie（`HttpOnly: false`, `Path: /`, `SameSite: Lax`）が発行されること。
- [x] CSRF トークンを持たない、または無効なトークンを伴う POST / PUT / DELETE リクエストが HTTP 403 Forbidden で拒絶されること。
- [x] 有効な CSRF トークン（リクエストヘッダー `X-XSRF-TOKEN`）を伴う POST / PUT / DELETE リクエストが正常に処理されること。
- [x] フロントエンドの `api/client.ts` において、`document.cookie` から `XSRF-TOKEN` を自動抽出し、状態変更リクエスト（POST, PUT, DELETE, PATCH）に `X-XSRF-TOKEN` ヘッダーを自動付与すること。
- [x] フロントエンドの `logout` 処理においても `X-XSRF-TOKEN` ヘッダーが付与され、正常にログアウトできること。
- [x] 全てのバックエンド単体・統合テストおよびフロントエンドテストが PASS すること。
- [x] ADR-0014 が作成され、`docs/adr/README.md` に登録されていること。

---

## 4. 機能受け入れシナリオ (Given-When-Then & 境界値・異常系)

### シナリオ 1: 許可されていないオリジンからの CORS リクエスト遮断（異常系）
- **Given**: バックエンドが稼働しており、許可オリジンに `https://attacker.duckdns.org` が含まれていない。
- **When**: オリジン `https://attacker.duckdns.org` から API `/api/v1/stocks` に対して Preflight（OPTIONS）または GET リクエストを送信する。
- **Then**: バックエンドは `Access-Control-Allow-Origin` ヘッダーを返却せず、ブラウザによってクロスオリジンアクセスが拒絶される。

### シナリオ 2: 許可されたオリジンからの CORS リクエスト受容（正常系）
- **Given**: バックエンドが稼働しており、許可オリジンに `http://localhost:5173` が含まれている。
- **When**: オリジン `http://localhost:5173` から API `/api/v1/stocks` に対して Preflight（OPTIONS）リクエストを送信する。
- **Then**: バックエンドは `Access-Control-Allow-Origin: http://localhost:5173` および `Access-Control-Allow-Credentials: true` を返却する。

### シナリオ 3: CSRF トークン欠落リクエストの遮断（異常系）
- **Given**: ユーザーが認証済みセッション Cookie（`JSESSIONID`）を保持している。
- **When**: リクエストヘッダー `X-XSRF-TOKEN` を付与せずに `POST /api/v1/stocks` リクエストを送信する。
- **Then**: バックエンドは HTTP 403 Forbidden を返却し、在庫アイテムの作成・登録は一切行われない。

### シナリオ 4: 無効な CSRF トークンリクエストの遮断（境界値・異常系）
- **Given**: ユーザーが認証済みセッション Cookie（`JSESSIONID`）を保持している。
- **When**: リクエストヘッダー `X-XSRF-TOKEN` に不正な値（`invalid-csrf-token-12345`）を設定して `POST /api/v1/stocks` リクエストを送信する。
- **Then**: バックエンドは HTTP 403 Forbidden を返却し、在庫アイテムの作成・登録は一切行われない。

### シナリオ 5: 有効な CSRF トークンを伴う状態変更リクエストの成功（正常系）
- **Given**: ユーザーが認証済みセッション Cookie（`JSESSIONID`）を保持し、レスポンス Cookie から取得した正規の `XSRF-TOKEN` 値を保持している。
- **When**: リクエストヘッダー `X-XSRF-TOKEN` に正規のトークン値を設定して `POST /api/v1/stocks` リクエストを送信する。
- **Then**: バックエンドはリクエストを受理し、HTTP 201 Created を返却して在庫アイテムが正常に永続化される。

### シナリオ 6: フロントエンドクライアントによる CSRF トークン自動付与（正常系）
- **Given**: ブラウザの Cookie に `XSRF-TOKEN=test-token-value` が保存されている。
- **When**: `api.createStock(...)` または `api.logout()` を実行する。
- **Then**: 送信される HTTP リクエストのヘッダーに `'X-XSRF-TOKEN': 'test-token-value'` が自動的に含まれる。
