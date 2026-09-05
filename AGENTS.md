# MyHomeStock AI駆動開発ハーネス規約 (AGENTS.md)

本リポジトリは、**Spring Boot 4 (Java 21) + React 18 (TypeScript Strict) + Vite + Tailwind CSS + PostgreSQL 16 + PWA** で構築された、OCI 統合単一コンテナ / Single JAR アーキテクチャの自宅在庫・買い物リスト管理 Web/PWA アプリケーションです。
AI エージェントおよび開発者は、本ドキュメントに定められた **「AIアシスト Issue & PR + ADR ハイブリッドワークフロー」** を厳格に遵守して開発を進めてください。

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
├── src/test/                           # バックエンド単体・統合テスト (8 tests / 100% PASS)
│
├── frontend/                           # React 18+ + Vite + TypeScript (Strict) PWA
│   ├── src/
│   │   ├── core/                       # 純粋なビジネスロジック (在庫不足・賞味期限計算、UI/DOM非依存、100%単体テスト可能)
│   │   ├── api/                        # OpenAPI 3.0 自動生成型 (schema.d.ts) および型安全 API クライアント (client.ts)
│   │   ├── hooks/                      # TanStack Query カスタムフック (キャッシュ・楽観的更新・競合検知)
│   │   ├── components/
│   │   │   ├── ui/                     # アトミックコンポーネント (Button, Card, Badge, Input 等)
│   │   │   └── layout/                 # ヘッダー, PWA インストールバナー
│   │   ├── App.tsx                     # 在庫・買い物リスト・期限注意ダッシュボード
│   │   └── main.tsx                    # QueryClient & PWA サービスワーカー登録
│   └── tests/                          # Vitest による単体・UIテスト
│
├── docs/                               # 設計・検証資産 (完全日本語、Single Source of Truth)
│   ├── adr/                            # Architecture Decision Records (不変の設計決定記録 0001〜0007)
│   ├── issues/                         # Issue / タスク一覧 (Git-Tracked、オフライン対応、0000-template.md)
│   ├── pre_phase_verification.md       # 各フェーズ開始前の4軸事前検証ログ
│   ├── implementation_plan.md          # フェーズごとの簡潔な作業計画書
│   ├── walkthrough.md                  # フェーズ完了・成果レポート
│   ├── architecture.md                 # システム全体アーキテクチャ設計書
│   └── openapi.json                    # OpenAPI 3.0 仕様書ベースライン
│
├── scripts/                            # 自動検査・型同期スクリプト
│   ├── securityCheck.js                # クレデンシャル・シークレット漏洩スキャナー
│   ├── docCheck.js                     # ドキュメント整合性・ADR・Issueインデックス検証
│   └── syncApi.js                      # SpringDoc OpenAPI -> TypeScript型自動同期
│
├── Dockerfile                          # Multi-stage build (JDK ビルド -> JRE 実行最小コンテナ)
├── docker-compose.yml                  # PostgreSQL 16 + Single JAR アプリ統合サービス
├── pom.xml                             # ルート Maven ビルド (frontend-maven-plugin による静的資産内包)
├── package.json                        # ルート統合スクリプト (npm run check, dev, sync-api 等)
└── AGENTS.md                           # AIエージェント開発ルール・規約 (本ドキュメント)
```

---

## 2. AIアシスト Issue & PR + ADR ハイブリッド開発フロー

機能追加・改修時は、コンテキストドリフトと仕様破壊を防ぐため以下の標準フローに従います：

```
[ 1. Issue 起票 & docs/issues 記録 ] ───> [ 2. ADR 作成 (必要時) ] ───> [ 3. ブランチ & 実装 ] ───> [ 4. PR作成 & CIパス ]
  (docs/issues/ISSUE-XXX_...md)            (docs/adr/000X-...)           (feature/issue-X-...)        (npm run check / GitHub Actions)
```

### ① Issue 起票とローカル管理 (`docs/issues/`)
- タスクはリポジトリ内の `docs/issues/ISSUE-XXX_タイトル.md` としてバージョン管理（Git-Tracked）し、`docs/issues/README.md` に登録します。
- ユーザーの要望に基づき、AIが「概要・要件定義・受け入れ基準（Acceptance Criteria）・技術論点」を整理してファイルを生成します（オンライン環境では GitHub Issues にも連携可能）。

### ② Issue ライフサイクル規定とエージェント自律判断ルール
Issue はプレフィックス付きラベル（`status:*`, `type:*`）によって管理し、AI エージェントは機械的に着手可否を判定します：

#### 進行ステータス (`status:*`)
| ステータス / ラベル | 意味・状態 | AIエージェントの行動基準 |
| :--- | :--- | :--- |
| **🟡 `status: backlog`** | **「アイデア・要件の保管」**<br>価値はあるが、今すぐは着手しない。 | **着手禁止**。<br>ユーザーから明示的に「Issue #X を着手して」と指示されるまで待機。 |
| **🟠 `status: todo`** | **「直近の実施候補」**<br>方向性は合意したが、要件詳細化中。 | 要件・設計の整理・対話を優先。 |
| **🔵 `status: ready`** | **「着手準備完了」**（Definition of Ready 達成）<br>要件・受入基準・設計論点が確定。 | **自律的に開発開始可能**。<br>トピックブランチを作成して実装を進めてよい。 |
| **🟣 `status: in-progress`** | **「開発中」**<br>トピックブランチで作業中。 | 実装・テスト・PR作成を実行中。 |
| **State: `CLOSED`** | **「完了」**（ラベル不要）<br>PRマージ＆品質ゲート合格完了。 | GitHub 標準機能で自動クローズ（statusラベルは剥がす）。 |

#### Issue の種類 (`type:*`)
- 🟢 **`type: feature`**: 新機能・機能拡張
- 🔴 **`type: bug`**: 不具合・バグ修正
- 🟡 **`type: refactor`**: リファクタリング（機能変更なし）
- 🧪 **`type: test`**: テスト作成・拡充
- 🤖 **`type: harness`**: AIエージェント開発環境・ガードレール・検査スクリプト
- 🚀 **`type: ci`**: CI/CD・GitHub Actions・ビルド設定
- 📘 **`type: docs`**: 設計書・ADR・仕様書

### ③ ADR（設計決定記録）の作成
- 新しいライブラリ選定やアーキテクチャ変更を伴う場合は、必ず `docs/adr/000X-xxx.md` を作成して意思決定理由を記録。
- `docs/adr/README.md` の一覧テーブルにも該当 ADR を必ず登録する（`node scripts/docCheck.js` で自動検証）。

### ④ ブランチ作成 & 実装 & 型同期
- `git checkout -b feature/issue-<番号>-<概要>` でブランチを切る。
- バックエンドの API を変更した場合は必ず `npm run sync-api` を実行し、フロントエンドの型定義を最新化する。
- コアロジック（`frontend/src/core/`）から順に実装し、`npm run check` ですべての品質ゲートを通過させる。

### ⑤ Pull Request 作成 & CI 自動検査
- PR 本文に `Closes #<Issue番号>` を含めて PR を作成。
- GitHub Actions CI で全検査の合格を確認後、マージ。

---

## 3. コンテキストドリフト & 仕様破壊の絶対防止ルール

1. **既存テストの弱体化・削除の厳禁**:
   - リファクタリングや機能追加時に既存のテストが失敗した際、テストの期待値やアサーションを安易に書き換えて合格させてはなりません。
   - 仕様変更である場合は、必ずユーザーの合意と ADR の更新を行った上でテストを改定してください。
2. **純粋コアロジックの不可侵**:
   - `frontend/src/core/` 内で React や DOM、ブラウザ API を絶対にインポートしないでください。
3. **JPA 楽観的排他制御の厳守**:
   - 在庫データや買い物リストの更新時は、エンティティの `@Version` カラムを必ず意識し、リクエスト DTO に `version` を含めて競合を検知してください。
4. **世帯マルチテナント (`household_id`) の分離**:
   - リポジトリおよびサービスでのデータ操作時は世帯識別子を正しく伝播させ、家族・世帯間のデータ漏洩を防止してください。
5. **ADR の遵守義務**:
   - 実装前に `docs/adr/` 配下のレコードを確認し、過去の設計決定と矛盾するコードを書いてはなりません。
6. **ドキュメントの完全日本語標準化**:
   - `docs/` 配下のすべての設計書・ADR・レポートは **完全日本語** で記述・更新してください。
7. **ワンショット品質ゲートの一括パス**:
   - コミット・PR作成前には必ず `npm run check` を実行し、全項目 PASS を確認してください。
8. **Windows PowerShell 環境での実行規約**:
   - Windows 環境では PowerShell のスクリプト実行ポリシーを回避するため、必ず `npm.cmd`（`npm.cmd run check` 等）および `.\mvnw.cmd` を使用してください。

---

## 4. 開発 & 検証コマンド一覧

| コマンド | 目的・実行内容 |
| :--- | :--- |
| `npm run check` | **ワンショット総合品質ゲート**: シークレットスキャン + ドキュメント整合性 + フロントエンド型検査 + フロントエンドテスト + 本番ビルド を一括実行 |
| `npm run security-check` | APIキーや秘密鍵、禁止 `.env` ファイルの誤混入を自動スキャン |
| `npm run doc-check` | `docs/` 配下の必須ドキュメントと ADR インデックス整合性を自動検証 |
| `npm run sync-api` | SpringDoc OpenAPI 3.0 スキーマから TypeScript 型定義 (`schema.d.ts`) を自動生成 |
| `npm run dev` | フロントエンド Vite 開発サーバー起動 (ポート 5173 / バックエンドプロキシ) |
| `npm run test` | フロントエンド Vitest 単体テストを 1 回実行 |
| `npm run build` | フロントエンドの TypeScript コンパイルおよび PWA 本番ビルド |
| `npm run db:up` | Docker Compose で PostgreSQL 16 コンテナをバックグラウンド起動 |
| `npm run db:down` | Docker Compose の PostgreSQL コンテナを停止 |
| `.\mvnw.cmd test` | バックエンドの単体・リポジトリ・統合テストを実行 (H2 インメモリ DB / 8 tests PASS) |
| `.\mvnw.cmd clean package` | フロントエンド PWA を静的リソースとして内包した OCI 単一実行可能 JAR を生成 |

---

## 5. 自律的サブエージェント（並列実行）安全規約

エージェントは以下の条件をすべて満たす場合のみ、ユーザーの明示的指示を待たずに自律的にサブエージェントを並列起動してタスクを分担実行してください：

1. **発動条件**:
   - 完全に独立した **3 つ以上の新規ファイル作成・単体テスト作成** または **並行リサーチ** であること。
   - 同一ファイルへの同時編集や直列依存（前工程の完了待ち）がないこと。
2. **安全ガードレール**:
   - **最大並列数**: 同時に起動するサブエージェントは **最大 4 体まで** とする。
   - **品質ゲートの一元化**: 各サブエージェントはコード作成・単体テスト作成のみを行い、**一括品質ゲート（`npm run check`）およびコミット・プッシュは親エージェントが全体の完了後に 1 回のみ実行すること**。
