# 実装計画書 (Implementation Plan) - ISSUE-030

- **対象Issue**: [ISSUE-030] 直前キャッシュによるオフライン閲覧保証（Pragmatic Offline-Read）と ADR-002 是正
- **作成日**: 2026-10-03
- **ステータス**: 🔵 着手前 (`status: ready`)

---

## 1. 変更対象ファイル一覧

| レイヤー | ファイルパス | 変更内容 |
| :--- | :--- | :--- |
| **設計ドキュメント** | `docs/adr/0002-pwa-mobile-offline-first.md` | 「オフラインファースト」の誇大記述を是正し、「直前キャッシュによるオフライン閲覧保証（Pragmatic Offline-Read）」として改定 |
| **フロントエンド依存** | `frontend/package.json` | `@tanstack/react-query-persist-client`, `@tanstack/query-sync-storage-persister` の追加 |
| **キャッシュ永続化** | `frontend/src/main.tsx` | `createSyncStoragePersister` + `persistQueryClient` による 24 時間 TTL キャッシュ永続化の構成 |
| **ネットワーク検知** | `frontend/src/hooks/useNetworkStatus.ts` | 新設: `navigator.onLine` および `online`/`offline` イベントによるネットワーク状態検知フック |
| **認証オフライン対応** | `frontend/src/hooks/useAuth.ts` | ネットワーク切断時の直前認証プロファイルフォールバックおよびログアウト時の完全ストレージ破棄（Purge） |
| **UI コンポーネント** | `frontend/src/components/layout/OfflineBanner.tsx` | 新設: オフライン閲覧中であることをユーザーに明示する警告バナー（最終同期日時表示） |
| **画面レイアウト** | `frontend/src/App.tsx` | `OfflineBanner` の配備およびオフライン時における更新系ボタンの `disabled` 制御 |
| **テスト** | `frontend/tests/hooks/useNetworkStatus.test.ts` | 新設: ネットワーク検知フックの単体テスト |
| **テスト** | `frontend/tests/auth/useAuthOffline.test.ts` | 新設: オフライン時の認証フォールバックおよびログアウト時キャッシュ消去テスト |

---

## 2. 実装手順（TDD / 段階的コミット）

### フェーズ 1: パッケージ導入とネットワーク状態検知フック（TDD）
1. `frontend/` に `@tanstack/react-query-persist-client` と `@tanstack/query-sync-storage-persister` をインストール。
2. `frontend/tests/hooks/useNetworkStatus.test.ts` を作成（Red）。
3. `frontend/src/hooks/useNetworkStatus.ts` を実装（Green）。
4. コミット: `feat(pwa): add useNetworkStatus hook for offline detection`

### フェーズ 2: 認証のオフラインフォールバックと完全破棄（TDD）
1. `frontend/tests/auth/useAuthOffline.test.ts` を作成（Red）。
   - ネットワークエラー発生時に 24 時間以内の認証プロファイルがあれば `isAuthenticated = true` となること。
   - `401 Unauthorized` 発生時、またはログアウト実行時にストレージが完全消去されること。
2. `frontend/src/hooks/useAuth.ts` を改修（Green）。
3. コミット: `feat(auth): support offline auth fallback and secure storage purge on logout`

### フェーズ 3: TanStack Query Persister によるキャッシュ永続化
1. `frontend/src/main.tsx` に `persistQueryClient` と `createSyncStoragePersister` を設定（`maxAge: 24h`）。
2. キャッシュのキープレフィックスやバスターキーを定義。
3. コミット: `feat(cache): persist tanstack query cache to local storage with 24h ttl`

### フェーズ 4: UI ガード（オフラインバナー & ボタン無効化）
1. `frontend/src/components/layout/OfflineBanner.tsx` を実装。
2. `frontend/src/App.tsx` にバナーを組み込み、在庫追加・購入・消費・編集・削除ボタンに `disabled={!isOnline}` を適用。
3. コミット: `feat(ui): display offline banner and disable mutation buttons when offline`

### フェーズ 5: ADR-0002 是正 & ドキュメント更新
1. `docs/adr/0002-pwa-mobile-offline-first.md` を改定（誇大表現削除、直前キャッシュ閲覧保証、3大ガードレールの記録）。
2. `docs/issues/ISSUE-030_offline_read_capable_pwa/walkthrough.md` を作成。
3. コミット: `docs(adr): update ADR-002 to reflect pragmatic offline read strategy`

---

## 3. 検証・品質ゲート
- **Inner Loop**:
  - `npm.cmd run test:related` による単体テスト高速実行
  - `npm.cmd run check:fast` による TypeScript Strict 型検査
- **Outer Loop**:
  - `npm.cmd run check` によるフル検証（シークレット、ドキュメント、型検査、テスト全件、プロダクションビルド）
