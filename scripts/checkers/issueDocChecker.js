/**
 * Issue & Root Document Integrity Checker
 * Verifies docs/issues/ folder completeness, 4-doc structure, and root pointer docs
 */

import fs from 'fs';
import path from 'path';

export function checkIssueDocIntegrity(docsDir) {
  let hasError = false;
  console.log('  📂 [Issue Doc Checker] docs/issues/ フォルダ構成およびルートポインタ検証...');

  const issuesDir = path.resolve(docsDir, 'issues');
  if (!fs.existsSync(issuesDir)) {
    console.error('\n❌ [Issue Doc Checker] docs/issues/ ディレクトリが存在しません。');
    return false;
  }

  // 1. Verify root pointer files
  const REQUIRED_ROOT_DOCS = [
    { filename: 'pre_phase_verification.md', title: '4軸事前検証ログ' },
    { filename: 'implementation_plan.md', title: '実装計画書' },
    { filename: 'walkthrough.md', title: '実装成果レポート' },
  ];

  for (const doc of REQUIRED_ROOT_DOCS) {
    const docPath = path.join(docsDir, doc.filename);
    if (!fs.existsSync(docPath)) {
      console.error(`\n❌ [ルートドキュメント欠落] docs/${doc.filename} が存在しません。`);
      hasError = true;
      continue;
    }
    const content = fs.readFileSync(docPath, 'utf-8').trim();
    if (content.length < 50) {
      console.error(`\n❌ [ルートドキュメント内容不足] docs/${doc.filename} の内容が極めて短小です (${content.length}文字)。`);
      hasError = true;
    }
  }

  // 2. Scan issue folders
  const entries = fs.readdirSync(issuesDir, { withFileTypes: true });
  const issueDirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('ISSUE-'))
    .map((e) => e.name)
    .sort();

  if (issueDirs.length === 0) {
    console.error('\n❌ [Issue ディレクトリ不在] docs/issues/ 配下に ISSUE-XXX フォルダが存在しません。');
    return false;
  }

  // Detect currently active issue from docs/implementation_plan.md
  const implPlanPath = path.join(docsDir, 'implementation_plan.md');
  const implPlanContent = fs.existsSync(implPlanPath) ? fs.readFileSync(implPlanPath, 'utf-8') : '';

  const FOUR_DOCS = ['issue.md', 'pre_verification.md', 'plan.md', 'walkthrough.md'];
  let validCount = 0;

  for (const dirName of issueDirs) {
    const dirPath = path.join(issuesDir, dirName);

    // issue.md is mandatory for all issue folders
    const issueMdPath = path.join(dirPath, 'issue.md');
    if (!fs.existsSync(issueMdPath)) {
      console.error(`\n❌ [Issue 仕様書欠落] ${dirName}/issue.md が存在しません。`);
      hasError = true;
      continue;
    }

    const issueMdContent = fs.readFileSync(issueMdPath, 'utf-8');
    const isCurrentActive =
      implPlanContent.includes(dirName) ||
      issueMdContent.includes('status: in-progress') ||
      issueMdContent.includes('status: in_progress');

    // For the active / in-progress issue, all 4 documents are strictly required
    if (isCurrentActive) {
      for (const docName of FOUR_DOCS) {
        const docFile = path.join(dirPath, docName);
        if (!fs.existsSync(docFile)) {
          console.error(`\n❌ [最新Issue必須ドキュメント欠落] ${dirName}/${docName} が存在しません（進行中Issueは4ファイル完結が必須です）。`);
          hasError = true;
        }
      }
    }

    // Content completeness check for any present documents
    for (const docName of FOUR_DOCS) {
      const docFile = path.join(dirPath, docName);
      if (fs.existsSync(docFile)) {
        const docContent = fs.readFileSync(docFile, 'utf-8').trim();
        if (docContent.length < 30) {
          console.error(`\n❌ [ドキュメント内容不足] ${dirName}/${docName} の内容が極めて短小です (${docContent.length}文字)。`);
          hasError = true;
        }
      }
    }

    validCount++;
  }

  // 3. Verify docs/issues/README.md table includes all issues
  const issuesReadmePath = path.join(issuesDir, 'README.md');
  if (!fs.existsSync(issuesReadmePath)) {
    console.error('\n❌ [Issue README 欠落] docs/issues/README.md が存在しません。');
    hasError = true;
  } else {
    const issuesReadmeContent = fs.readFileSync(issuesReadmePath, 'utf-8');
    for (const dirName of issueDirs) {
      const issueNum = dirName.split('_')[0]; // ISSUE-001
      if (!issuesReadmeContent.includes(issueNum)) {
        console.error(`\n❌ [Issue 一覧未登録] ${dirName} が docs/issues/README.md のテーブルに登録されていません。`);
        hasError = true;
      }
    }
  }

  console.log(`    ✓ docs/issues/: 全 ${validCount} 件の Issue フォルダ構造・仕様書および進行中Issueの4ファイル完結性を確認済`);

  return !hasError;
}
