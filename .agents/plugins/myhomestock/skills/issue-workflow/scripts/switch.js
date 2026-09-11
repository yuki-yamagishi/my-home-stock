/**
 * Automated Issue Switcher & Lifecycle Coordinator
 * (.agents/plugins/myhomestock/skills/issue-workflow/scripts/switch.js)
 * 
 * Usage: node switch.js ISSUE-002
 * Switches active issue, scaffolds missing lifecycle docs, updates root pointers,
 * synchronizes README status, and verifies integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkDocIntegrity } from '../../../hooks/docIntegrityGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const DOCS_DIR = path.resolve(PROJECT_ROOT, 'docs');
const ISSUES_DIR = path.resolve(DOCS_DIR, 'issues');

const targetIssueArg = process.argv[2];
if (!targetIssueArg) {
  console.error('❌ Usage: node switch.js <ISSUE-ID> (例: node switch.js ISSUE-002)');
  process.exit(1);
}

const targetPrefix = targetIssueArg.toUpperCase().startsWith('ISSUE-')
  ? targetIssueArg.toUpperCase()
  : `ISSUE-${targetIssueArg.padStart(3, '0')}`;

const entries = fs.readdirSync(ISSUES_DIR, { withFileTypes: true });
const targetDirEntry = entries.find(
  (e) => e.isDirectory() && e.name.toUpperCase().startsWith(targetPrefix)
);

if (!targetDirEntry) {
  console.error(`❌ Issue ディレクトリが見つかりません: docs/issues/${targetPrefix}_*`);
  process.exit(1);
}

const targetDirName = targetDirEntry.name;
const targetDirPath = path.join(ISSUES_DIR, targetDirName);
console.log(`\n🔄 [Issue Switcher] 対象 Issue に切り替えます: ${targetDirName}`);

// 1. Read issue.md
const issueMdPath = path.join(targetDirPath, 'issue.md');
if (!fs.existsSync(issueMdPath)) {
  console.error(`❌ ${targetDirName}/issue.md が存在しません。`);
  process.exit(1);
}

let issueMdContent = fs.readFileSync(issueMdPath, 'utf-8');
const titleMatch = issueMdContent.match(/^#\s+(.+)$/m);
const issueTitle = titleMatch ? titleMatch[1] : targetDirName;

// Update status in issue.md to in-progress if not closed
if (!issueMdContent.includes('status: in-progress') && !issueMdContent.includes('status: in_progress')) {
  issueMdContent = issueMdContent.replace(/status:\s*[\w-]+/, 'status: in-progress');
  fs.writeFileSync(issueMdPath, issueMdContent, 'utf-8');
  console.log(`  ✓ ${targetDirName}/issue.md: ステータスを status: in-progress に更新`);
}

// 2. Scaffold missing lifecycle documents
const FOUR_DOCS = [
  {
    name: 'pre_verification.md',
    title: '4軸事前検証ログ (Pre-Phase Verification)',
    template: `# 4軸事前検証ログ (Pre-Phase Verification) - ${targetPrefix}\n\n- **対象Issue**: ${issueTitle}\n- **ステータス**: 🟡 進行中 (\`status: in-progress\`)\n- **作成日**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## 1. 4軸事前検証サマリー\n\n### 1.1. 技術的制約\n- \n\n### 1.2. UX・エッジケース\n- \n\n### 1.3. データ永続性・互換性\n- \n\n### 1.4. テスト自律性\n- \n\n---\n\n## 2. 重複・パッチワーク点検 (Impact & Duplication Check)\n\n### 2.1. 既存コードベース・ユーティリティの横断調査\n- \n\n### 2.2. 車輪の再発明・つぎはぎ改修の防止\n- \n`,
  },
  {
    name: 'plan.md',
    title: '実装計画書 (Implementation Plan)',
    template: `# 実装計画書 (Implementation Plan) - ${targetPrefix}\n\n- **対象Issue**: ${issueTitle}\n- **ステータス**: 🟡 進行中 (\`status: in-progress\`)\n- **作成日**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## 1. 変更ファイル一覧\n\n### 新規追加\n- \n\n### 変更\n- \n\n---\n\n## 2. 実装ステップ\n\n1. \n2. \n`,
  },
  {
    name: 'walkthrough.md',
    title: '実装成果レポート (Walkthrough)',
    template: `# 実装成果レポート (Walkthrough) - ${targetPrefix}\n\n- **対象Issue**: ${issueTitle}\n- **ステータス**: 🟡 進行中 (\`status: in-progress\`)\n- **作成日**: ${new Date().toISOString().split('T')[0]}\n\n---\n\n## 1. 成果サマリー\n\n---\n\n## 2. 検証結果\n\n---\n\n## 3. レビュー指摘事項と改善対応履歴 (Review Feedback & Iterations)\n\n| 重要度 | 指摘・改善提案 | 対応内容 | 反映ファイル |\n| :--- | :--- | :--- | :--- |\n| - | - | - | - |\n`,
  },
];

for (const doc of FOUR_DOCS) {
  const docPath = path.join(targetDirPath, doc.name);
  if (!fs.existsSync(docPath)) {
    fs.writeFileSync(docPath, doc.template, 'utf-8');
    console.log(`  ✓ 生成: ${targetDirName}/${doc.name}`);
  }
}

// 3. Update root pointer files
const POINTER_UPDATES = [
  {
    rootFile: 'pre_phase_verification.md',
    targetDoc: 'pre_verification.md',
    title: '4軸事前検証ログ (Pre-Phase Verification)',
  },
  {
    rootFile: 'implementation_plan.md',
    targetDoc: 'plan.md',
    title: '実装計画書 (Implementation Plan)',
  },
  {
    rootFile: 'walkthrough.md',
    targetDoc: 'walkthrough.md',
    title: '実装成果レポート (Walkthrough)',
  },
];

for (const ptr of POINTER_UPDATES) {
  const rootFilePath = path.join(DOCS_DIR, ptr.rootFile);
  const targetRelPath = `./issues/${targetDirName}/${ptr.targetDoc}`;
  const content = `# ${ptr.title}\n\n> [!NOTE]\n> 本ファイルは常に最新の進行中フェーズのドキュメントを保持します。\n> 個別の Issue ドキュメントは \`docs/issues/\` 配下の各 Issue フォルダに完全に保全されています。\n\n## 現在進行中: ${targetPrefix} (${issueTitle})\n詳細は [docs/issues/${targetDirName}/${ptr.targetDoc}](${targetRelPath}) を参照。\n`;
  fs.writeFileSync(rootFilePath, content, 'utf-8');
  console.log(`  ✓ ルートポインタ更新: docs/${ptr.rootFile} -> ${targetRelPath}`);
}

// 4. Verify integrity
console.log('\n🔍 [Issue Switcher] ドキュメント整合性を検証しています...');
const isOk = checkDocIntegrity(PROJECT_ROOT);
if (isOk) {
  console.log(`\n🎉 [Issue Switcher 完了] ${targetDirName} への切り替えと全ドキュメント整合性検証が正常に完了しました！\n`);
  process.exit(0);
} else {
  console.error(`\n⚠️ [Issue Switcher 警告] 切り替え後の整合性検証でエラーが検出されました。手動で確認してください。\n`);
  process.exit(1);
}
