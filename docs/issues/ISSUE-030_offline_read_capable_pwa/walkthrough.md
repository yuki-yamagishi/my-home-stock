# 成果レポート (Walkthrough) - ISSUE-030

- **対象Issue**: [ISSUE-030] 直前キャッシュによるオフライン閲覧保証（Pragmatic Offline-Read）と ADR-002 是正
- **作成日**: 2026-10-03
- **ステータス**: 🟣 実装完了・Pre-PR検証中 (`status: in-progress`)

---

## 1. 変更概要サマリー

| 項目 | 内容 |
| :--- | :--- |
| **Why（動機）** | スーパーの地下や電波障害時における買い物リストの閲覧不能解消、および ADR-002 誇大表現と実装の乖離の是正 |
| **What（変更内容）** | 1. ADR-002 改定（Pragmatic Offline-Read として再定義）<br>2. TanStack Query Persister 導入（localStorage, TTL 24h）<br>3. `useNetworkStatus` フック新設<br>4. 認証オフラインフォールバック & ログアウト時完全消去（`authStorage.ts`）<br>5. `OfflineBanner` コンポーネント新設 & 更新系全ボタンの物理的無効化（Disabled） |
| **排除したリスク** | 1. 圏外時のログイン画面強制送還リスク<br>2. ログアウト後のローカルデータ残存リスク<br>3. オフライン中の操作によるデータ競合（409 Conflict）リスク<br>4. 古いキャッシュの永久残存リスク |

---

## 2. 実装詳細と成果物

### 2.1. コアロジック & 永続化ストレージ (`frontend/src/core/authStorage.ts`)
- **タイムスタンプ付きプロファイル保持**: 成功時に `myhomestock:auth_profile` に表示用 DTO（名前、世帯名、ロール、アイコン）をキャッシュ。
- **24時間 TTL 時限失効**: `AUTH_CACHE_TTL_MS`（24時間）を超過したキャッシュは自動的に破棄され、古いデータの永久残存を防止。
- **完全物理破棄 (Purge)**: `clearAllLocalPersistence()` により、ログアウト時および 401 Unauthorized 検知時に認証プロファイルおよびクエリキャッシュ（`myhomestock:query_cache`）を完全に消去。

### 2.2. ネットワーク状態検知フック (`frontend/src/hooks/useNetworkStatus.ts`)
- `navigator.onLine` および `online`/`offline` イベントをリッスンし、`isOnline`, `isOffline`, `lastChangedAt` を提供。

### 2.3. 認証オフラインフォールバック (`frontend/src/hooks/useAuth.ts`)
- ネットワーク切断時（`Failed to fetch`）に、24時間以内の直前認証プロファイルが存在する場合は未認証画面に落とさず、`user` を返却してダッシュボードを表示。
- 401 エラー受信時、および `useLogout` 実行時に `clearAllLocalPersistence()` を即時呼び出し。

### 2.4. TanStack Query Persister 構成 (`frontend/src/main.tsx`)
- `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister` を導入。
- `gcTime` および `maxAge` を 24 時間に設定し、アプリ再起動後も直前キャッシュを即時復元。

### 2.5. UI ガード & オフライン明示 (`frontend/src/components/layout/OfflineBanner.tsx`, `frontend/src/App.tsx`)
- オフライン時、画面上部に「⚠️ オフライン表示中 (最終同期: HH:mm) - 電波復帰時に自動更新されます」バナーを固定表示。
- 更新系操作（在庫追加、購入完了、1段階消費、4段階残量変更、数量増減、詳細編集、削除、モバイルFAB）ボタンをすべて `disabled={isOffline}` に設定し、誤操作や 409 競合を未然防止。
- 電波復帰時にバックグラウンドで最新実データに自動同期（SWR）され、バナー消去とボタン活性化がシームレスに動作。

### 2.6. ADR-0002 是正 (`docs/adr/0002-pwa-mobile-offline-first.md`)
- 「オフラインファースト」「地下でも更新」という誇大表現を排し、「直前キャッシュによるオフライン閲覧保証（Pragmatic Offline-Read）」として改定。
- セキュリティ 3 大ガードレールおよびオフライン更新制限を正式な決定事項として明記。

---

## 3. 検証結果

- [x] 単体テスト（Vitest 8 ファイル / 59 テスト全件 PASS）
- [x] TypeScript Strict 型検査（`npm run check:fast`: エラー 0 件）
- [x] ドキュメント整合性検査（`npm run check:docs`: ADR 14 件 & Issue 17 件 整合）
- [x] フル品質ゲート（`npm run check`: シークレット、型検査、テスト、Vite PWA プロダクションビルド全件合格）

---

## 4. レビュー指摘事項と改善対応履歴

| # | レビュアー | 指摘内容 (Conventional Comments) | 重要度 | 対応方針 / 修正コミット |
| :- | :--- | :--- | :--- | :--- |
| 1 | `fleet_reviewer` | `App.tsx` の `lastSyncedAt` の初期値は未同期であることを明示する `null` にすべき | `[should]` | `useState<Date \| null>(null)` に修正。未同期時に時刻を表示せず、最初のデータ取得成功時に現在時刻をセットするよう改善。 |
| 2 | `fleet_reviewer` | `useNetworkStatus` のカスタムフック本体に対するテストの追加 | `[should]` | `@testing-library/react` + `jsdom` を導入し、`tests/hooks/useNetworkStatus.test.ts` にイベント駆動テスト（online/offline イベント発火時の state 遷移、unmount 時のイベントリスナークリーンアップ）を網羅追加（計6件PASS）。 |
| 3 | `fleet_reviewer` | `FamilyMembersModal` のメンバー招待ボタンにもオフライン時の disabled ガードを追加するとより一貫性が高まる | `[imo]` | `FamilyMembersModal.tsx` に `useNetworkStatus` を導入し、招待ボタンに `disabled={isOffline}` ガードを追加。 |

