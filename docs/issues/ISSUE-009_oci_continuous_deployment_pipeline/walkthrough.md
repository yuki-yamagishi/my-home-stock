# 実装成果レポート (Walkthrough) - ISSUE-009

- **対象Issue**: [ISSUE-009] OCI Always Free 向け GitHub Actions イミュータブル継続的デプロイ（CD）パイプラインの構築
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-15

---

## 1. 成果サマリー

*(実装完了後に詳細を追記)*

---

## 2. 検証結果

*(実装完了後に詳細を追記)*

---

## 3. レビュー指摘事項と改善対応履歴 (Review Feedback & Iterations)

| 重要度 | 指摘・改善提案 | 対応内容 | 反映ファイル |
| :--- | :--- | :--- | :--- |
| `[must]` | Dockerfile 構造およびローカル開発環境との整合性の未定義（QEMU 遅延回避と既存 DX 保護の両立） | 本番専用に `Dockerfile.prod` を新設し、事前ビルド済み Single JAR を直接 COPY する方針を策定。既存 `Dockerfile` は一切変更せず保護。 | `issue.md`, `plan.md`, `Dockerfile.prod` |
| `[must]` | ヘルスチェックエンドポイント（Actuator vs `/api/v1/health`）の仕様矛盾 | 未導入の Actuator ではなく、既存の堅牢な `/api/v1/health`（DB 疎通確認を含む）を本番ヘルスチェックとして正式採用し矛盾を解消。 | `issue.md`, `plan.md`, `docker-compose.prod.yml` |
| `[must]` | 受け入れ基準（DoD）における Given-When-Then シナリオおよび境界値・異常系の完全欠落 | 4つの客観的検証シナリオ（正常系CD、CI失敗時CD抑止、Watchtower反映・DB巻き込み防止、GHCR自動パージ）を正式策定。 | `issue.md`, `plan.md` |
| `[should]` | Watchtower による DB コンテナ巻き込み再起動リスクおよび GHCR 認証 | `app` コンテナのみに `com.centurylinklabs.watchtower.enable=true` を付与し、Watchtower 側で `--label-enable` を指定して DB コンテナを物理除外。 | `issue.md`, `plan.md`, `docker-compose.prod.yml` |
| `[should]` | GHCR 自動パージの権限（`packages: write`）と保持ルールの確定 | ワークフロー権限に `packages: write` を明記し、`latest` および直近 5 バージョンを恒久保護する確定値を設定。 | `issue.md`, `plan.md`, `deploy.yml` |
| `[imo]` | フロントエンドビルドと Maven パッケージングのキャッシュ最適化 | `actions/cache` により Maven 依存関係および Node.js キャッシュを活用し、全工程 10分以内の完了を確実化。 | `plan.md`, `deploy.yml` |
