/**
 * Automated Issue Switcher & Lifecycle Coordinator
 * Usage: node scripts/issueSwitch.js ISSUE-002
 * Switches active issue, scaffolds missing lifecycle docs, updates root pointers,
 * synchronizes README status, and verifies integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkIssueDocIntegrity } from './checkers/issueDocChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.resolve(PROJECT_ROOT, 'docs');
const ISSUES_DIR = path.resolve(DOCS_DIR, 'issues');

const targetIssueArg = process.argv[2];
if (!targetIssueArg) {
  console.error('❌ Usage: node scripts/issueSwitch.js <ISSUE-ID> (例: node scripts/issueSwitch.js ISSUE-002)');
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
    header: `# 4軸事前検証ログ (Pre-Phase Verification) - ${targetPrefix}\n\n- **対象Issue**: ${issueTitle}\n- **ステータス**: 🟡 進行中 (\`status: in_progress\`)\n\n## 1. 4軸事前検証サマリー\n1. 技術的制約:\n2. UX・エッジケース:\n3. データ永続性・互換性:\n4. テスト自律性:\n`,
  },
  {
    name: 'plan.md',
    header: `# 実装計画書 (Implementation Plan) - ${targetPrefix}\n\n- **対象Issue**: ${issueTitle}\n- **ステータス**: 🟡 進行中 (\`status: in_progress\`)\n\n## 1. 変更ファイル一覧\n- \n\n## 2. 実装ステップ\n- \n\n## 3. 検証手順\n- npm.cmd run check\n`,
  },
  {
    name: 'walkthrough.md',
    header: `# 実装成果レポート (Walkthrough) - ${targetPrefix}\n\n- **対象Issue**: ${issueTitle}\n- **ステータス**: 🟡 進行中 (\`status: in_progress\`)\n\n## 1. 成果サマリー\n- \n\n## 2. 検証結果\n- [ ] npm run check (PASS)\n`,
  },
];

for (const doc of FOUR_DOCS) {
  const docPath = path.join(targetDirPath, doc.name);
  if (!fs.existsSync(docPath)) {
    fs.writeFileSync(docPath, doc.header, 'utf-8');
    console.log(`  ✓ 新規作成: ${targetDirName}/${doc.name}`);
  }
}

// 3. Update root pointers in docs/
const rootPointers = [
  {
    file: 'implementation_plan.md',
    title: '実装計画書 (Implementation Plan)',
    targetSubPath: `issues/${targetDirName}/plan.md`,
  },
  {
    file: 'pre_phase_verification.md',
    title: '4軸事前検証ログ (Pre-Phase Verification)',
    targetSubPath: `issues/${targetDirName}/pre_verification.md`,
  },
  {
    file: 'walkthrough.md',
    title: '実装成果レポート (Walkthrough)',
    targetSubPath: `issues/${targetDirName}/walkthrough.md`,
  },
];

for (const ptr of rootPointers) {
  const ptrPath = path.join(DOCS_DIR, ptr.file);
  const ptrContent = `# ${ptr.title}

> [!NOTE]
> 本ファイルは常に最新の進行中フェーズのドキュメントを保持します。
> 個別の Issue 履歴は \`docs/issues/\` 配下の各 Issue フォルダに完全に保全されています。

## 現在進行中: ${issueTitle}
詳細は [docs/${ptr.targetSubPath}](./${ptr.targetSubPath}) を参照。
`;
  fs.writeFileSync(ptrPath, ptrContent, 'utf-8');
  console.log(`  ✓ ルートポインタ更新: docs/${ptr.file} -> ${targetDirName}`);
}

// 4. Update docs/issues/README.md status table
const issuesReadmePath = path.join(ISSUES_DIR, 'README.md');
if (fs.existsSync(issuesReadmePath)) {
  let readmeContent = fs.readFileSync(issuesReadmePath, 'utf-8');
  // Update status row for targetPrefix
  const rowRegex = new RegExp(`(\\|\\s*\\*\\*\\[${targetPrefix}\\]\\([^)]+\\)\\*\\*\\s*\\|[^|]+\\|)[^|]+(\\|)`);
  if (rowRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(rowRegex, `$1 🟣 \`status: in-progress\` $2`);
    fs.writeFileSync(issuesReadmePath, readmeContent, 'utf-8');
    console.log(`  ✓ docs/issues/README.md: ${targetPrefix} を status: in-progress に更新`);
  }
}

console.log('\n🔍 [Issue Switcher] ドキュメント整合性を検証中...');
const ok = checkIssueDocIntegrity(DOCS_DIR);
if (!ok) {
  console.error('\n❌ [Issue Switcher] ドキュメント整合性検証に失敗しました。');
  process.exit(1);
}

console.log(`\n🎉 [Issue Switcher] ${targetPrefix} (${issueTitle}) への切り替えとポインタ同期が完了しました！\n`);
process.exit(0);
