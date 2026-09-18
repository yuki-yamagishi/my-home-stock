# 実装計画書 (Implementation Plan) - ISSUE-015

- **対象Issue**: ISSUE-015: antigravity-review-loop 自動更新 GitHub Actions ワークフローの導入
- **ステータス**: 🟣 進行中 (`status: in-progress`)
- **作成日**: 2026-09-18

---

## 1. 変更対象ファイル一覧

| 変更区分 | ファイルパス | 変更概要 |
| :--- | :--- | :--- |
| **[NEW]** | `.github/workflows/update-review-loop-submodule.yml` | 完全自律 Pull 型サブモジュール自動更新 & PR 作成ワークフロー |
| **[NEW]** | `.github/dependabot.yml` | Git Submodule 日次追跡 Dependabot 設定 |
| **[MODIFY]** | `.gitmodules` | `branch = main` 設定の明示化 |
| **[MODIFY]** | `.agents/plugins/antigravity-review-loop` | リモート最新コミット (`65aa8b9`) へのポインタ更新 |
| **[NEW]** | `docs/adr/0013-automated-submodule-update-workflow.md` | アップストリーム非干渉・完全自律 Pull 型アーキテクチャ ADR |
| **[MODIFY]** | `docs/adr/README.md` | ADR-0013 の登録 |
| **[NEW]** | `docs/issues/ISSUE-015_.../` 4ドキュメント | `issue.md`, `pre_verification.md`, `plan.md`, `walkthrough.md` |
| **[MODIFY]** | `docs/issues/README.md` | ISSUE-015 の登録 |
| **[MODIFY]** | `docs/` ルートポインタ | `implementation_plan.md` 等の最新化 |

---

## 2. 実装ステップ

1. **ブランチ作成**:
   - `git checkout -b feature/issue-15-auto-update-review-loop-submodule-workflow`
2. **Git Submodule 追跡設定 & 最新化**:
   - `.gitmodules` に `branch = main` を追加
   - サブモジュールをリモート最新（`65aa8b9`）に更新
3. **完全自律 Pull 型 GitHub Actions ワークフロー作成**:
   - `.github/workflows/update-review-loop-submodule.yml` (schedule + workflow_dispatch + 事前品質テスト)
4. **Dependabot 設定**:
   - `.github/dependabot.yml` (gitsubmodule 日次更新)
5. **ADR 作成**:
   - `docs/adr/0013-automated-submodule-update-workflow.md`
   - `docs/adr/README.md`
6. **品質ゲート & 検証**:
   - `npm.cmd run check:fast`
   - `npm.cmd run check:docs`
   - `npm.cmd run check`
7. **PR 作成 & 独立 Fleet レビュー合議**:
   - `fleet_reviewer`, `fleet_completion_auditor`, `stock_domain_auditor`
