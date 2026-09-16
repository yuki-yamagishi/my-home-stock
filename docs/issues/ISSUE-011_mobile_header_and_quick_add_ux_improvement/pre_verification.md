# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-011

- **対象Issue**: [ISSUE-011] スマートフォン向けUI/UX最適化（ヘッダー見切れ解消・ボトムナビ導入・在庫追加モーダル化）
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-16

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **Tailwind CSS レスポンシブブレークポイントの統一**:
  - モバイルとデスクトップの境界は Tailwind の標準ブレークポイント `sm:` (640px) を厳格に適用する。
  - モバイル (`< 640px`):
    - ヘッダー内のナビゲーションタブを非表示 (`hidden sm:flex`)。
    - 画面最下部に固定ボトムナビゲーションバー（`fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200`）をマウント。
    - 画面右下に固定フローティングアクションボタン（FAB: `fixed right-4 bottom-20 z-30`）をマウント。
    - コンテンツ領域の最下部に十分なパディング（`pb-28`）を付与し、ボトムナビやFABによって一覧カードの操作ボタンが隠れないようにする。
- **PWA モバイルセーフエリア対応**:
  - iPhone 等のホームインジケーター（Home Bar）領域を考慮し、ボトムナビに `pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]` 等のセーフエリア余白を確保する。
- **モーダルフォーカスとキーボード表示**:
  - `CreateStockModal` は `EditStockModal` と同様に背景オーバーレイ（`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50`）と中央揃え/下部シート配置を適用し、モバイルブラウザの仮想キーボード出現時にもスクロール可能な `max-h-[90vh] overflow-y-auto` を適用する。

### 1.2. UX・エッジケース
- **極小画面（幅 320px〜375px: iPhone SE 等）での見切れ完全防止**:
  - ヘッダー左側: アイコンとアプリ名を非表示、または極小アイコン（`h-6 w-6`）＋世帯名のみ。世帯名が極端に長い場合でも `max-w-[140px] truncate` によりオーバーフローを防ぐ。
  - ヘッダー右側: 世帯管理ボタンはモバイルではテキストを非表示にしてアイコンボタン（`Users`）化。アバター（`h-8 w-8`）およびログアウト（`p-1.5`）と合わせても横幅 110px 程度に収まり、320px 画面でも余裕で収まる。
- **在庫追加導線のアクセシビリティ・視認性**:
  - スクロール位置に関係なく即座に追加できるよう、右下に浮動する FAB（丸い緑のボタン、シャドウ付き、タップターゲット 52px）を提供。
  - 加えて、在庫一覧・買い物リストのヘッダー部にも「+ 在庫を追加」ボタンを残し、FAB に気づかないユーザーへのリダンダンシー（冗長性）を担保する。
- **モーダル破棄とステート保護**:
  - 閉じるボタン（×）押下やオーバーレイクリック、または登録完了時にモーダルを閉じる。
  - 入力中の誤タップによる消失を防ぐため、フォーム送信成功時のみフォームを初期化する。

### 1.3. データ永続性・互換性
- **バックエンド API / DB 変更なし**:
  - 本改修は完全なフロントエンド UI/UX 改善であり、バックエンドの REST API、DTO、データベースマイグレーション、OpenAPI 仕様書（`docs/openapi.json`）の変更は発生しない。
  - `CreateStockModal` においても既存の `useCreateStock` フックをそのまま使用し、楽観的排他制御・世帯マルチテナント分離の安全性を 100% 担保する。

### 1.4. テスト自律性
- **高速型検査 & 品質ゲート**:
  - `npm run check:fast` (tsc --noEmit) で型安全性を即座に検証。
  - `npm run test:related` (Vitest) で既存のコアロジックテストの非破壊を検証。
  - `npm run check` (統合品質ゲート) でプロダクションビルドおよびドキュメント整合性を一括検証。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **`EditStockModal.tsx`**:
  - 既に完成された在庫編集モーダルが存在する。モーダルの背景、コンテナ、閉じるボタン、スクロール領域、4段階残量ボタングループのスタイルはこれを直接踏襲し、UI/UX の一貫性を極大化する。
- **`Header.tsx`**:
  - 既存の `activeTab`, `setActiveTab`, `shoppingCount`, `expiringCount` などの props はそのまま維持し、モバイル表示時にクラスの切り替え（`sm:hidden`, `hidden sm:flex`）を行う。
- **`core/stockStatus.ts` & `constants/categories.ts`**:
  - 4段階残量定義（`REMAINING_LEVEL_ORDER`, `REMAINING_LEVEL_CONFIGS`, `remainingLevelToQuantity`）やカテゴリ一覧をそのまま再利用し、重複定義やロジック分散を完全に防止する。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- `App.tsx` にインラインで大量のフォームコードが埋め込まれていた現状（991行）を解消し、`frontend/src/components/stock/CreateStockModal.tsx` および `frontend/src/components/layout/BottomNav.tsx` に責務を分割する。
- これにより、`App.tsx` のコード行数が削減され、コンポーネントごとの単一責任（SRP）とテスト容易性が向上する。
