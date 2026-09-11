# 4軸事前検証ログ (Pre-Phase Verification) - ISSUE-006

- **対象Issue**: ISSUE-006: antigravity-review-loop プラグインの Git Submodule 導入および重複機能の整理
- **ステータス**: 🟡 進行中 (`status: in-progress`)
- **作成日**: 2026-09-11

---

## 1. 4軸事前検証サマリー

### 1.1. 技術的制約
- **Git Submodule 仕様**:
  - `git submodule add https://github.com/yuki-yamagishi/antigravity-review-loop.git .agents/plugins/antigravity-review-loop` により `.gitmodules` を生成。
  - プラグイン側は独立した Git リポジトリとして管理され、MyHomeStock 側からは一切修正しない。
  - Node.js 標準モジュール（`fs`, `path`, `child_process`）のみで動作するため、外部 npm パッケージ依存の競合は発生しない。

### 1.2. UX・エッジケース
- **新規開発者の環境セットアップ**:
  - `git clone` 直後は submodule が空ディレクトリとなる可能性があるため、`pluginChecker.js`（`docCheck.js` 経由）で `git submodule update --init --recursive` の案内を自動表示し、ビルドや品質ゲートで明瞭に通知・ブロックする。
- **Inner Loop 高速反復**:
  - プラグインの `dev-lifecycle` スキルで定義されている `npm run check:fast`, `npm run test:fast`, `npm run test:related` を `package.json` に定義し、開発者の思考テンポを損なわない。

### 1.3. データ永続性・互換性
- **4ドキュメント構造との完全互換**:
  - プラグインが要求する `docs/issues/ISSUE-XXX/` の 4 ドキュメント（`issue.md`, `pre_verification.md`, `plan.md`, `walkthrough.md`）は、MyHomeStock の既存運用と完全に一致しており、過去の Issue（ISSUE-001〜005）および ADR（0001〜0008）は無修正・無損失で保全される。

### 1.4. テスト自律性
- **品質ゲートの自律検証**:
  - `npm.cmd run check` により、シークレットスキャン、Submodule配備・プラグイン整合性検証（`pluginChecker.js`）、ADR整合性、Issue整合性、TypeScript型検査、単体テスト、本番ビルドをワンショットで自律実行可能。

---

## 2. 重複・パッチワーク点検 (Impact & Duplication Check)

### 2.1. 既存コードベース・ユーティリティの横断調査
- **旧スキル (`.agents/skills/dev-harness/SKILL.md`)**:
  - プラグイン側の `skills/issue-lifecycle/`, `skills/dev-lifecycle/`, `skills/review-self-healing/` がより包括的かつ厳密に定義しているため、100% 重複。削除して一本化。
- **旧サブエージェント (`.agents/subagents/fleet-reviewer/`)**:
  - プラグイン側の `agents/fleet_reviewer.md`, `agents/fleet_completion_auditor.md`, `agents/fleet_dor_auditor.md` が合議制および反証義務を含めて高度に体系化されているため、100% 重複。削除して一本化。
- **チェッカー (`scripts/checkers/pluginChecker.js`)**:
  - 旧重厚チェッカー `agentSkillChecker.js`（保守負債）を撤廃し、Submodule 未展開リスクを物理排除する軽量 `pluginChecker.js` を新設。パッチワークではなく責務を根本的に刷新。

### 2.2. 車輪の再発明・つぎはぎ改修の防止
- プロジェクト内に独自のレビューループやフック機構を個別追加・再発明せず、公式プラグイン `antigravity-review-loop` を Submodule としてそのまま活用する。
