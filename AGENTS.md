# MyHomeStock AI駆動開発ハーネス規約 (AGENTS.md)

本リポジトリは、**Spring Boot 4 (Java 21) + Vue 3 (TypeScript Strict, Composition API) + Vite + Tailwind CSS v4 + PostgreSQL 16 + PWA** で構築された、OCI 統合単一コンテナ / Single JAR アーキテクチャの自宅在庫・買い物リスト管理 Web/PWA アプリケーションです。
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
├── frontend/                           # Vue 3 + Vite + TypeScript (Strict) + Tailwind CSS v4 PWA
│   ├── src/
│   │   ├── core/                       # 純粋なビジネスロジック (在庫不足・賞味期限計算、UI/DOM非依存、100%単体テスト可能)
│   │   ├── api/                        # OpenAPI 3.0 自動生成型 (schema.d.ts) および型安全 API クライアント (client.ts)
│   │   ├── stores/                     # Pinia ストア (在庫、買い物リスト、世帯管理)
│   │   ├── components/
│   │   │   ├── ui/                     # 汎用 UI コンポーネント (Button, Card, Badge, Modal 等)
│   │   │   ├── stock/                  # 在庫管理機能コンポーネント
│   │   │   ├── shopping/               # 買い物リスト機能コンポーネント
│   │   │   └── layout/                 # ヘッダー, PWA インストールバナー
│   │   ├── App.vue                     # メインレイアウト
│   │   └── main.ts                     # Vue アプリ初期化 & Pinia & PWA 登録
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
│   │   └── agentSkillChecker.js        # AGENTS.md およびスキル定義同期検証
│   ├── securityCheck.js                # クレデンシャル・シークレット漏洩スキャナー
│   ├── docCheck.js                     # 各種チェッカーを統括するオーケストレーター
│   └── syncApi.js                      # SpringDoc OpenAPI -> TypeScript型自動同期
│
├── .agents/                            # AIエージェント設定・カスタムサブエージェント
│   ├── skills/dev-harness/SKILL.md     # 開発ハーネススキル定義
│   └── subagents/fleet-reviewer/       # 独立レビューサブエージェント (Fleet)
│       ├── subagent.json               # 最小権限設定
│       └── SYSTEM_PROMPT.md            # Conventional Comments 独立レビュー規約
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

### ④ ワンショット品質ゲート (`npm run check`)
コミット前・プッシュ前には必ず以下のコマンドで全件合格を確認します：
```bash
npm run check
```
実行される自動検証：
1. `securityCheck.js`: 秘密情報・APIキー・クレデンシャル混入検知
2. `docCheck.js`: Issue 4ドキュメント、ADR、エージェント定義の整合性検証
3. `type-check`: TypeScript 型検査
4. `test:run`: 単体テスト・UIテスト
5. `build`: プロダクションビルド・PWA Manifest 検証

### ⑤ 独立レビューサブエージェント (Fleet)
- PR 作成後、実装担当エージェントとは別の **Fleet Reviewer Subagent**（`.agents/subagents/fleet-reviewer/`）を呼び出し、客観的な第三者視点で `git diff` をレビューします。
- **Conventional Comments** 形式の重要度接頭辞を使用：
  - `[must]`: マージ前に修正必須（バグ、セキュリティ脆弱性、破壊的変更）
  - `[should]`: 強く推奨（保守性、エラーハンドリング向上）
  - `[imo]`: 私見・提案（リファクタリング、別案）
  - `[nits]`: 些細な指摘（typo、命名修正）
  - `[ask]`: 質問・確認
- 総合判定として `[LGTM]` または `[要修正]` を明示し、`gh pr comment` で PR に公式コメントとして投稿します。

### ⑥ 人間承認マージ
- 自動マージは禁止。Fleet Reviewer の指摘を解消し、人間開発者のレビューと承認を経てマージを行います。

---

## 3. コンテキストドリフト & 仕様破壊の絶対防止ルール

1. **既存テストの弱体化・削除の厳禁**:
   - リファクタリングや機能追加時に既存テストが失敗した際、テストの期待値やアサーションを安易に書き換えて合格させてはなりません。
2. **純粋コアロジックの不可侵**:
   - `frontend/src/core/` 内で Vue や DOM、ブラウザ API を直接インポートしてはなりません。
3. **JPA 楽観的排他制御の厳守**:
   - 在庫データの更新時はエンティティの `@Version` を意識し、リクエストに `version` を含めて競合を検知してください。
4. **世帯マルチテナント (`household_id`) の分離**:
   - データアクセス時は世帯識別子を正しく伝播させ、世帯間のデータ混入を防止してください。
5. **Windows PowerShell 環境での実行規約**:
   - Windows 環境では必ず `npm.cmd`（`npm.cmd run check` 等）および `.\mvnw.cmd` を使用してください。
