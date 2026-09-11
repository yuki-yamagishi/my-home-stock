---
name: issue-workflow
description: >-
  MyHomeStock における Issue ライフサイクルの切り替え、4ドキュメントの自動スキャフォールド、ルートポインタ同期を行う Runbook。
  新機能開発やバグ修正に着手する際、対象 Issue の切り替え時に使用する。
---

# Issue ライフサイクル切り替え Runbook (issue-workflow)

このスキルは、**MyHomeStock** において `docs/issues/` 配下の対象 Issue を切り替え、4 ドキュメント完結構造およびルートポインタ（`implementation_plan.md` 等）を自動同期するための公式手順です。

---

## 1. 実行手順

1. **Issue の切り替え実行**:
   ```bash
   node .agents/plugins/myhomestock/skills/issue-workflow/scripts/switch.js <ISSUE-ID>
   ```
   例:
   ```bash
   node .agents/plugins/myhomestock/skills/issue-workflow/scripts/switch.js ISSUE-002
   ```

2. **自動実行される処理**:
   - `docs/issues/ISSUE-XXX/` の `issue.md` のステータスを `status: in-progress` に更新。
   - 不足しているライフサイクルドキュメント（`pre_verification.md`, `plan.md`, `walkthrough.md`）を自動スキャフォールド。
   - ルートポインタ（`docs/pre_phase_verification.md`, `docs/implementation_plan.md`, `docs/walkthrough.md`）を最新 Issue に同期。
   - ドキュメント整合性ガード（`docIntegrityGuard.js`）を実行し、整合性を検証。
