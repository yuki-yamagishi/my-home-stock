# 実装計画書 (Implementation Plan) - ISSUE-006

- **対象Issue**: ISSUE-006: antigravity-review-loop プラグインの Git Submodule 導入および重複機能の整理
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-11

---

## 1. 変更ファイル一覧

### 新規追加
- `.gitmodules`: Git Submodule 設定ファイル
- `.agents/plugins/antigravity-review-loop`: 公式プラグイン Submodule
- `.agents/plugins/myhomestock`: MyHomeStock 専用プラグイン
- `scripts/checkers/pluginChecker.js`: Submodule 配備 & プラグイン整合性物理チェッカー
- `docs/adr/0009-adopt-antigravity-review-loop-plugin.md`: プラグイン導入と重複機能一元化の設計決定記録
- `docs/issues/ISSUE-006_migrate_to_antigravity_review_loop_plugin/issue.md`: Issue 仕様書
- `docs/issues/ISSUE-006_migrate_to_antigravity_review_loop_plugin/pre_verification.md`: 事前検証ログ
- `docs/issues/ISSUE-006_migrate_to_antigravity_review_loop_plugin/plan.md`: 実装計画書
- `docs/issues/ISSUE-006_migrate_to_antigravity_review_loop_plugin/walkthrough.md`: 成果レポート

### 削除
- `.agents/skills/dev-harness/SKILL.md`: プラグインスキル群と重複
- `.agents/subagents/fleet-reviewer/subagent.json`: プラグイン合議エージェント群と重複
- `.agents/subagents/fleet-reviewer/SYSTEM_PROMPT.md`: プラグイン合議エージェント群と重複
- `scripts/checkers/agentSkillChecker.js`: 重厚・過剰な文字列照合（保守負債）として撤廃

### 変更
- `scripts/docCheck.js`: `pluginChecker.js` の呼び出し追加
- `.github/workflows/ci.yml`: 全ジョブにおける `submodules: recursive` チェックアウト追加
- `package.json`: Inner Loop コマンド追加
- `AGENTS.md`: プラグイン構成・合議制レビュー・物理フック仕様の反映
- `docs/adr/README.md`: ADR-0009 の目次登録
- `docs/issues/README.md`: ISSUE-006 の登録
- `docs/pre_phase_verification.md`: 最新 Issue へのポインタ更新
- `docs/implementation_plan.md`: 最新 Issue へのポインタ更新
- `docs/walkthrough.md`: 最新 Issue へのポインタ更新

---

## 2. 実装ステップ

1. **Git Submodule 登録**:
   - `git submodule add https://github.com/yuki-yamagishi/antigravity-review-loop.git .agents/plugins/antigravity-review-loop`
2. **重複ファイル削除**:
   - `git rm -r .agents/skills/dev-harness`
   - `git rm -r .agents/subagents/fleet-reviewer`
3. **チェッカー・設定更新**:
   - `agentSkillChecker.js` を撤廃し、Submodule 未展開リスクを物理排除する軽量 `pluginChecker.js` を新設・`docCheck.js` に統合。
   - `.github/workflows/ci.yml` の各ジョブに `submodules: recursive` を追加。
   - `package.json` に `check:fast`, `test:fast`, `test:related` を追加。
4. **ガバナンス・ADR・Issue 作成**:
   - `AGENTS.md` の構成図およびライフサイクルセクションを更新。
   - `docs/adr/0009-adopt-antigravity-review-loop-plugin.md` を作成し、`docs/adr/README.md` に登録。
   - ISSUE-006 の 4 ドキュメントを作成し、`docs/issues/README.md` およびルートポインタを同期。
5. **品質ゲート検証**:
   - `npm.cmd run check` の全パスを確認。
