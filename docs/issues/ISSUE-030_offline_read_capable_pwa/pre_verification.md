# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-030

- **対象Issue**: [ISSUE-030] 直前キャッシュによるオフライン閲覧保証（Pragmatic Offline-Read）と ADR-002 是正
- **ステータス**: 🔵 着手前 (`status: ready`)
- **作成日**: 2026-10-03

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **TanStack Query Persister の選定**:
  - `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister` は TanStack Query v5 公式のエコシステムであり、React 18 と完全互換。
  - キャッシュストレージとして `window.localStorage` を採用する。
    - 在庫アイテム数が数百件程度であれば数KB〜数十KB程度であり、localStorage の 5MB クォータ内に余裕で収まる。
    - 同期的な読み書きが可能であり、アプリ起動時のちらつき（Flash of Unstyled Content / Loading Spinner）を最小化できる。
    - IndexedDB（非同期）に比べて複雑な初期化処理が不要であり、ログアウト時の完全消去（`storage.removeItem`）が同期的・物理的に保証される。
  - `buster`（バージョンキー）を設定し、スキーマ変更時に古いキャッシュが自動破棄される仕組みを導入する。
- **Cookie 認証（HttpOnly）とオフラインの関係**:
  - サーバーのセッション Cookie（`JSESSIONID`）はブラウザ内に保持されているが、オフライン時はサーバーにアクセスできないため、`/api/v1/auth/me` のセッション検証は行えない。
  - そのため、表示用のユーザー情報（`AuthUser`: 名前、世帯名、ロール、アイコンURL）のみを `localStorage` にタイムスタンプ付きで安全にミラーリング保持する。
  - セッショントークンや秘密情報は一切含めない（No Secrets In Storage）。

### 1.2. UX・エッジケース
- **地下スーパーでの表示速度**:
  - アプリ起動時にローカルキャッシュから即座に在庫一覧と買い物リストを描画するため、地下圏外環境でも待たされずに確認可能（体感 0 秒表示）。
- **Lie-Fi（通信が不安定な状態）**:
  - `navigator.onLine` が `true` でも実際の HTTP 通信がタイムアウト・失敗するケースがある。
  - そのため、単に `navigator.onLine` だけでなく、TanStack Query の `error`（`Failed to fetch`）の発生も考慮した複合判定を行う。
- **電波復帰時のちらつき防止**:
  - 地上に出て電波が復帰した際、バックグラウンドフェッチ（SWR）が成功するまでは直前キャッシュの表示を維持し、通信完了時に滑らかに最新実データへ同期する。
- **オフライン中の操作制限**:
  - 買い物完了や数量変更などのボタンを `disabled` にし、誤ってタップしてデータが保存されなかったと落胆する体験を防ぐ。

### 1.3. データ永続性・互換性
- **バックエンド・データベーススキーマへの影響なし**:
  - 本改修はフロントエンド（クライアントサイドキャッシュ・UI制御）およびドキュメント（ADR-002）の是正であり、Spring Boot 側や PostgreSQL DB スキーマ、Flyway マイグレーションの変更はゼロ。
- **OpenAPI スキーマ互換性**:
  - 既存の REST API エンドポイントや Request/Response DTO の変更はないため、`docs/openapi.json` および `schema.d.ts` の破壊的変更は生じない。

### 1.4. テスト自律性
- **フロントエンド Vitest 単体テスト**:
  - `navigator.onLine` のモックや `localStorage` のモックを使用し、以下のシナリオをミリ秒単位で自律テスト可能にする：
    1. オフライン状態検知フック（`useNetworkStatus`）の動作
    2. オフライン時における直前キャッシュの読み込みと表示
    3. オフライン時における更新ボタンの `disabled` 制御
    4. ログアウト時におけるローカルストレージの完全消去
    5. 401 エラー受信時におけるローカルストレージの自動破棄
  - 外部ネットワークやブラウザの実機を必要とせず、Vitest（Inner Loop）で 100% 自律検証できる。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **`frontend/src/main.tsx`**:
  - 現在 `new QueryClient(...)` を直接インスタンス化している。
  - ここに `PersistQueryClientProvider`（または `persistQueryClient`）を導入し、中央集権的にキャッシュ永続化を設定する。
- **`frontend/src/hooks/useAuth.ts`**:
  - 現在、通信失敗時は単純にエラー状態となり `isAuthenticated = false` と判定される。
  - ここに「通信エラーかつ直前キャッシュが存在する場合はオフライン認証状態として扱う」フォールバックを追加。
  - `useLogout` において、`queryClient.clear()` に加えて `localStorage` の Persister キャッシュおよび認証プロファイルを完全に破棄する処理を一元化。
- **`frontend/src/hooks/useStockItems.ts`**:
  - 既存のフック群（`useStockList`, `useShoppingList` 等）は TanStack Query のキャッシュキー（`STOCK_KEYS`）を正しく定義しているため、Persister を導入するだけで自動的に永続化対象となる。追加の個別パッチワークは不要。
- **`frontend/src/App.tsx`**:
  - オフラインバナーを配置し、各ボタンの `disabled` 判定に `isOffline` を渡す。コンポーネントの責務分離を維持し、場当たり的なインライン処理を排除する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- 自前で IndexedDB のラッパーやオレオレ同期エンジンを書くのではなく、TanStack Query 公式の Persister パッケージ（`@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister`）を活用する。
- オフライン検知も独自イベントループを回さず、標準の Web API（`online`/`offline` イベント）を React カスタムフックとしてクリーンにカプセル化する。
