# 実装計画書 (Implementation Plan) - ISSUE-007

- **対象Issue**: ISSUE-007: Google OAuth2 認証とデータベース駆動型世帯管理および完全プライベートアクセスガードの導入
- **作成日**: 2026-09-14
- **計画者**: AIエージェント

---

## 1. 変更対象ファイル一覧

| レイヤー | ファイルパス | 変更区分 | 目的・概要 |
| :--- | :--- | :---: | :--- |
| **Backend/DB** | `src/main/resources/db/migration/V2__oauth2_household_schema.sql` | 新設 | `users`, `households`, `household_members` テーブル定義 |
| **Backend/Security** | `src/main/java/com/myhomestock/config/SecurityConfig.java` | 変更 | OAuth2 / OIDC ログイン、認可ルール、Cookie セキュリティ設定 |
| **Backend/Service** | `src/main/java/com/myhomestock/service/UserHouseholdSyncService.java` | 新設 | ユーザー・世帯同期、門前払い物理ガード（`isAllowed`）、メール小文字正規化 |
| **Backend/Service** | `src/main/java/com/myhomestock/service/CustomOidcUserService.java` | 新設 | Google OIDC ユーザー情報取得・同期フック |
| **Backend/Service** | `src/main/java/com/myhomestock/service/HouseholdService.java` | 新設 | 世帯メンバー取得、オーナーによる家族招待 |
| **Backend/Controller**| `src/main/java/com/myhomestock/controller/StockItemController.java` | 変更 | `X-Household-Id` ヘッダー完全撤廃、サーバー側世帯解決強制 |
| **Backend/Test** | `src/test/java/com/myhomestock/UserHouseholdSyncServiceTest.java` | 新設 | 認証成功・門前払い・家族参加・大文字小文字・除名遮断の全テスト |
| **Frontend/Auth** | `frontend/src/components/auth/LoginCard.tsx` | 変更 | Google ログインボタン、認証エラーメッセージ表示 |
| **Frontend/Layout** | `frontend/src/components/layout/Header.tsx` | 変更 | ユーザー表示、世帯名表示、家族管理モーダル起動 |
| **Frontend/Household**| `frontend/src/components/household/FamilyMembersModal.tsx` | 新設 | メンバー一覧・家族招待モーダル |
| **Docs/ADR** | `docs/adr/0010-google-oauth2-database-household-authorization.md` | 新設・更新 | 設計決定記録（パターンBおよびプライベートガード） |

---

## 2. 検証手順

1. `.\mvnw.cmd test`: バックエンド全 23 件テスト合格
2. `npm.cmd run check`: 型検査、Vitest、Vite PWA ビルド、シークレット漏洩スキャン合格
3. OCI サーバーへのデプロイおよび稼働確認
