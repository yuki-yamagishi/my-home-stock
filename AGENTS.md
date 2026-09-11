# MyHomeStock AI駆動開発ハーネス規約 (AGENTS.md)

本リポジトリは、**Spring Boot 4 (Java 21) + React 18 (TypeScript Strict) + Vite + Tailwind CSS + TanStack Query + PostgreSQL 16 + PWA** で構築された、OCI 統合単一コンテナ / Single JAR アーキテクチャの自宅在庫・買い物リスト管理 Web/PWA アプリケーションです。
AI エージェントおよび開発者は、本ドキュメントに定められた **「AIアシスト Issue & PR + ADR + 独立Fleetレビュー + 自動品質ガード」** を厳格に遵守して開発を進めてください。

---

## 1. クリーンアーキテクチャ構成

本プロジェクトは、関心の分離、テスト容易性、および複数端末でのデータ整合性を最優先する **Feature/Domain-Driven Clean Architecture** に基づいて構成されています。

```
MyHomeStock/
├── src/main/java/com/myhomestock/      # Spring Boot 4.0.x (Java 21) Single JAR バックエンド
│   ├── config/                         # OpenAPI, Security, SpaWebMvcConfig (SPAフォールバック)
│   ├── controller/                     # REST コントローラー & GlobalExceptionHandler
│   ├── domain/
│   │   ├── entity/                     # JPA エンティティ (@Version による楽観的排他 & household_id)
│   │   └── dto/                        # Request/Response DTO (Jakarta Validation 付き)
│   ├── repository/                     # Spring Data JPA リポジトリ (世帯分離クエリ対応)
│   └── service/                        # ビジネスロジック & トランザクション境界 (@Transactional)
├── src/main/resources/
│   ├── application.yml                 # PostgreSQL 接続, Flyway, SpringDoc
│   ├── application-test.yml            # H2 インメモリ DB テスト設定
│   └── db/migration/                   # Flyway SQL マイグレーション (V1: 楽観排他+世帯ID)
├── src/test/                           # バックエンド単体・統合テスト
│
├── frontend/                           # React 18 + Vite + TypeScript (Strict) + Tailwind CSS PWA
│   ├── src/
│   │   ├── core/                       # 純粋なビジネスロジック (在庫不足・賞味期限計算、UI/DOM非依存、100%単体テスト可能)
│   │   ├── api/                        # OpenAPI 3.0 自動生成型 (schema.d.ts) および型安全 API クライアント (client.ts)
│   │   ├── hooks/                      # TanStack Query カスタムフック (キャッシュ・楽観的更新・競合検知)
│   │   ├── components/
│   │   │   ├── ui/                     # 汎用 UI コンポーネント (Button, Card, Badge, Modal 等)
│   │   │   ├── layout/                 # ヘッダー, PWA インストールバナー
│   │   │   ├── stock/                  # 在庫管理機能コンポーネント
│   │   │   └── shopping/               # 買い物リスト機能コンポーネント
│   │   ├── App.tsx                     # メインレイアウト・ダッシュボード
│   │   └── main.tsx                    # React アプリ初期化 & QueryClientProvider & PWA 登録
│   └── tests/                          # Vitest による単体・UIテスト
│
├── docs/                               # 設計・検証資産 (完全日本語、Single Source of Truth)
│   ├── adr/                            # Architecture Decision Records (不変の設計決定記録 0001〜0008)
│   ├── issues/                         # Issue ライフサイクルフォルダ (docs/issues/ISSUE-XXX/ 4ドキュメント完結型)
│   ├── pre_phase_verification.md       # 最新フェーズの4軸事前検証ログ (ポインタ)
│   ├── implementation_plan.md          # 最新フェーズの実装計画書 (ポインタ)
│   ├── walkthrough.md                  # 最新フェーズの実装成果レポート (ポインタ)
│   ├── architecture.md                 # システム全体アーキテクチャ設計書
│   └── openapi.json                    # OpenAPI 3.0 仕様書ベースライン
│
├── scripts/                            # 自動検査・型同期スクリプト
│   ├── checkers/                       # モジュール化された整合性チェッカー群
│   │   ├── issueDocChecker.js          # docs/issues/ 4ドキュメントおよびルートポインタ整合性検証
│   │   ├── adrChecker.js               # docs/adr/ 採番および目次同期検証
│   │   └── openapiSyncChecker.js       # docs/openapi.json と TypeScript 型定義の同期検証
│   ├── securityCheck.js                # クレデンシャル・シークレット漏洩スキャナー
│   ├── docCheck.js                     # 各種チェッカーを統括するオーケストレーター
│   ├── issueSwitch.js                  # Issue ライフサイクル切り替え・自動ポインタ同期
│   └── syncApi.js                      # SpringDoc OpenAPI -> TypeScript型自動同期
│
├── .agents/plugins/                    # Antigravity プラグイン群 (Composable Plugins)
│   ├── antigravity-review-loop/        # 【汎用ガバナンス】Git Submodule (無修正)
│   │   ├── hooks.json                  # 物理ライフサイクルフック (DoR Gate, Safety Guard, Pre-PR Gate, Stop Hook)
│   │   ├── rules/single-command.md     # 単一コマンド実行規約
│   │   ├── skills/                     # 汎用ライフサイクル (issue-lifecycle, dev-lifecycle, review-self-healing)
│   │   └── agents/                     # 汎用合議 (fleet_reviewer, fleet_completion_auditor, fleet_dor_auditor)
│   └── myhomestock/                    # 【MyHomeStock 専用プラグイン】(AGY公式仕様完全準拠)
│       ├── plugin.json                 # プラグインマニフェスト
│       ├── hooks.json                  # 専用フック (openapi-sync-guard: 型同期物理ガード)
│       ├── rules/domain-constraints.md # ドメイン不変則 (JPA楽観排他, 世帯分離, コアロジック不可侵)
│       ├── skills/                     # 専用 Runbook (sync-api, db-workflow)
│       └── agents/stock_domain_auditor.md # ドメイン整合性・4大原則専門監査役
│
├── .githooks/                          # 共有 Git Hooks
│   ├── pre-commit                      # シークレットスキャン + ドキュメント整合性検証
│   └── pre-push                        # 全体品質ゲート (npm run check)
│
├── Dockerfile                          # Multi-stage build (JDK ビルド -> JRE 実行最小コンテナ)
├── docker-compose.yml                  # PostgreSQL 16 + Single JAR アプリ統合サービス
├── pom.xml                             # ルート Maven ビルド (frontend-maven-plugin による静的資産内包)
├── package.json                        # ルート統合スクリプト (npm run check, dev, sync-api 等)
└── AGENTS.md                           # AIエージェント開発ルール・規約 (本ドキュメント)
```

---

## 2. AIアシスト開発ライフサイクル（6 ステップ）

```
[ 1. Issue 起票 & 4ドキュメント ] ───> [ 2. ADR 作成 (必要時) ] ───> [ 3. ブランチ作成 & 実装 ]
  (docs/issues/ISSUE-XXX/)                (docs/adr/000X-...)           (feature/issue-X-...)
           │
           ▼
[ 4. ローカル品質ゲート通過 ] ───────> [ 5. PR作成 & Fleet レビュー ] ───> [ 6. 人間承認 & マージ ]
  (npm run check / Git Hooks)            (Conventional Comments)             (gh pr merge)
```

### ① Issue 起票と 4 ドキュメント完結型管理 (`docs/issues/`)
各タスクは `docs/issues/ISSUE-XXX_<title>/` ディレクトリを作成し、ライフサイクルを通じて以下の 4 つのドキュメントを維持します：
1. `issue.md`: 要件定義、背景、受け入れ基準、技術的論点
2. `pre_verification.md`: 4軸事前検証ログ（技術的制約、UX、永続性、テスト自律性）
3. `plan.md`: 実装計画、変更対象ファイル一覧、検証手順
4. `walkthrough.md`: 成果レポート、動作検証結果、変更サマリー

ルートの `docs/` 配下（`pre_phase_verification.md`, `implementation_plan.md`, `walkthrough.md`）には、現在進行中の最新 Issue へのポインタを維持します。

### ② Conventional Commits 規約
コミットメッセージは必ず以下のプレフィックスを使用してください：
- `feat:`: 新機能・機能追加
- `fix:`: バグ修正
- `docs:`: ドキュメントのみの変更
- `refactor:`: バグ修正や機能追加を含まないコード改善
- `test:`: テストの追加・修正
- `chore:`: ビルドプロセスや補助ツールの変更、ハーネス整備
- `ci:`: CI/CD 設定の変更

### ③ ADR（設計決定記録）の作成
- アーキテクチャ変更や新しい設計方針を導入する場合は、`docs/adr/000X-xxx.md` を作成。
- `docs/adr/README.md` の一覧テーブルに必ず登録（`node scripts/docCheck.js` で自動検証）。

### ④ Inner Loop（開発中高速反復）と Outer Loop（PR前一括検証）の分離
思考のテンポと開発生産性を極大化するため、**軽微な修正のたびに重い本番ビルドを伴う `npm run check` を連発することを厳禁とします**（グローバル憲章第 2.1 条）。

1. **Inner Loop（開発中・TDD高速反復）**:
   - 変更箇所にスコープを絞った最小・最速の検証をミリ秒単位で反復実行します：
     - **型検査のみ確認 (約1秒)**:
       ```bash
       npm.cmd run check:fast
       ```
     - **関連単体テストのみ高速実行 (約1秒)**:
       ```bash
       npm.cmd run test:related
       ```
     - **ドキュメント整合性のみ確認 (約0.2秒)**:
       ```bash
       node scripts/docCheck.js
       ```
   - **TDD中間コミット時**:
     - Git Pre-Commit Hook (`.githooks/pre-commit`) により、シークレット漏洩とドキュメント整合性が自動検証されます。手動で重い全量チェックを叩く必要はありません。

2. **Outer Loop（PR作成直前・プッシュ前・CI）**:
   - すべての実装・テストが完了し、**PRを作成する直前の最終関門としてのみ 1 回実行**します：
     ```bash
     npm.cmd run check
     ```
   - 実行される自動検証：
     1. `securityCheck.js`: 秘密情報・APIキー・クレデンシャル混入検知
     2. `docCheck.js`: ADR、Issue 4ドキュメント、OpenAPI型同期の整合性検証
     3. `type-check`: TypeScript Strict 型検査
     4. `test:run`: 単体テスト・UIテスト全件
     5. `build`: Vite プロダクションビルド・PWA Manifest 生成検証
   - ※ リモートプッシュ時には Git Pre-Push Hook により `npm.cmd run check` が自動強制されます。

### ⑤ 独立レビューサブエージェント合議制 (Fleet Review Consortium)
- PR 作成後は、汎用ガバナンスプラグイン（`antigravity-review-loop`）および専用プラグイン（`myhomestock`）に基づき、以下の専門サブエージェントを `invoke_subagent` で並行起動して客観的な合議レビューを受領します：
  - **`fleet_reviewer`**: コード品質・型安全性・セキュリティ・アーキテクチャ原則・デッドロック防止の専門レビュー
  - **`fleet_completion_auditor`**: 批判的完了性・Why / 排除リスク・受け入れ基準（DoD）・やり残し監査
  - **`stock_domain_auditor`**: MyHomeStock 固有の 4 大ドメイン原則（JPA楽観排他、世帯分離、コアロジック不可侵、OpenAPI型同期）の専門監査
- **Conventional Comments** 形式の重要度接頭辞を使用：
  - `[must]`: マージ前に修正必須（バグ、セキュリティ脆弱性、破壊的変更）
  - `[should]`: 強く推奨（保守性、エラーハンドリング向上）
  - `[imo]`: 私見・提案（リファクタリング、別案）
  - `[nits]`: 些細な指摘（typo、命名修正）
  - `[ask]`: 質問・確認
  - `[good]`: 優れた実装への賞賛・DoD達成確認
- **合議制（Consortium Consensus）とセルフLGTMの物理禁止**:
  - 全レビュアーが共に `LGTM`（未解決ブロッキング指摘 0 件）となった場合のみ承認。
  - コード修正（自己修復）が入った場合は、過去のレビュー判定は Stale（無効化）され、必ず再レビュー（Re-review & Re-audit）を受領すること。エージェント自身による自己承認（セルフLGTM）は厳禁。
- **物理ライフサイクルフック (`hooks.json`)**:
  - `branchDoRGate.js`: ブランチ作成前の Definition of Ready（DoR: Why, 排除リスク, 受入シナリオ）および作業ツリーのクリーン性を物理強制。
  - `safetyGuard.js`: 自律エージェントによる `gh pr merge` の直接実行や対話型テストによるハングを物理遮断。
  - `prePrAuditGate.js`: PR作成前の4軸ドキュメントおよびPre-PR DoDの未完了チェックを物理検証。
  - `stopHook.js`: レビューループ完了前の早期セッション停止を物理ブロック。
  - `openapiSyncGuard.js`: コミット・PR作成時の OpenAPI 仕様書と TypeScript 型定義の乖離を物理ブロック。

### ⑥ 人間承認マージ専権
- PR 発行直後の自動マージは厳禁。エージェント自身による `gh pr merge` の実行は物理的に遮断されています。
- Fleet レビュー合議の成立および CI 全パスを確認後、人間（ユーザー）に最終確認とマージを依頼すること。

---

## 3. ドメイン不変則 & ガバナンス規約

MyHomeStock 固有の設計制約・コーディング規約は、専用プラグイン内のルールとして常時自動ロードされます：
- **詳細ルール定義**: [`.agents/plugins/myhomestock/rules/domain-constraints.md`](.agents/plugins/myhomestock/rules/domain-constraints.md)
  1. **JPA 楽観的排他制御の厳守**: `@Version` による競合検知、HTTP 409 Conflict ハンドリング。
  2. **世帯マルチテナントの完全分離**: 全クエリ・更新における `household_id` の必須伝播。
  3. **純粋コアロジックの不可侵**: `frontend/src/core/` への DOM/React 非依存の徹底。
  4. **OpenAPI 3.0 型安全バインド**: `docs/openapi.json` と `schema.d.ts` の 100% 同期。
  5. **対応履歴・レビュー改善ログの完全記録義務**: `walkthrough.md` にレビュー指摘と改善対応の対照表を必ず記録。

