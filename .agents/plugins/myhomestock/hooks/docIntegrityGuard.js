/**
 * Document & Architecture Integrity Guard (.agents/plugins/myhomestock/hooks/docIntegrityGuard.js)
 * Verifies docs/adr/ (Architecture Decision Records) and docs/issues/ (4-document lifecycle)
 * along with root pointers (implementation_plan.md, walkthrough.md, pre_phase_verification.md).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function checkDocIntegrity(projectRoot) {
  console.log('  📝 [Doc Integrity Guard] ADR および Issue 4ドキュメント整合性検証...');
  const docsDir = path.resolve(projectRoot, 'docs');
  let hasError = false;

  // 1. Check ADRs
  const adrDir = path.join(docsDir, 'adr');
  if (!fs.existsSync(adrDir)) {
    console.error('\n❌ [Doc Guard] docs/adr/ ディレクトリが存在しません。');
    hasError = true;
  } else {
    const adrReadmePath = path.join(adrDir, 'README.md');
    if (!fs.existsSync(adrReadmePath)) {
      console.error('\n❌ [Doc Guard] docs/adr/README.md が存在しません。');
      hasError = true;
    } else {
      const adrReadmeContent = fs.readFileSync(adrReadmePath, 'utf-8');
      const adrFiles = fs.readdirSync(adrDir).filter((file) => {
        return file.endsWith('.md') && file !== 'README.md' && file !== '0000-template.md';
      });

      const unlistedAdrs = [];
      for (const adrFile of adrFiles) {
        const adrMatch = adrFile.match(/^(\d{4})/);
        const adrNumber = adrMatch ? `ADR-${adrMatch[1]}` : adrFile;

        if (!adrReadmeContent.includes(adrFile) && !adrReadmeContent.includes(adrNumber)) {
          unlistedAdrs.push(`${adrFile} (${adrNumber})`);
        }
      }

      if (unlistedAdrs.length > 0) {
        console.error('\n❌ [ADR インデックス未登録] 以下の ADR ファイルが docs/adr/README.md の一覧テーブルに登録されていません:');
        unlistedAdrs.forEach((item) => console.error(`   - ${item}`));
        console.error('   👉 対処法: docs/adr/README.md のテーブルに該当 ADR を追記してください。');
        hasError = true;
      } else {
        console.log(`    ✓ docs/adr/README.md: 全 ${adrFiles.length} 件の ADR 登録・採番整合性を確認済`);
      }
    }
  }

  // 2. Check Issue 4-Docs and Root Pointers
  const issuesDir = path.join(docsDir, 'issues');
  if (!fs.existsSync(issuesDir)) {
    console.error('\n❌ [Doc Guard] docs/issues/ ディレクトリが存在しません。');
    hasError = true;
  } else {
    // 2.1 Root pointer docs
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

    // 2.2 Issue folders
    const entries = fs.readdirSync(issuesDir, { withFileTypes: true });
    const issueDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('ISSUE-'))
      .map((e) => e.name)
      .sort();

    if (issueDirs.length === 0) {
      console.error('\n❌ [Issue ディレクトリ不在] docs/issues/ 配下に ISSUE-XXX フォルダが存在しません。');
      hasError = true;
    } else {
      const implPlanPath = path.join(docsDir, 'implementation_plan.md');
      const implPlanContent = fs.existsSync(implPlanPath) ? fs.readFileSync(implPlanPath, 'utf-8') : '';
      const FOUR_DOCS = ['issue.md', 'pre_verification.md', 'plan.md', 'walkthrough.md'];
      let validCount = 0;

      for (const dirName of issueDirs) {
        const dirPath = path.join(issuesDir, dirName);
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

        if (isCurrentActive) {
          for (const docName of FOUR_DOCS) {
            const docFile = path.join(dirPath, docName);
            if (!fs.existsSync(docFile)) {
              console.error(`\n❌ [最新Issue必須ドキュメント欠落] ${dirName}/${docName} が存在しません（進行中Issueは4ファイル完結が必須です）。`);
              hasError = true;
            }
          }
        }

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

        const walkthroughPath = path.join(dirPath, 'walkthrough.md');
        if (fs.existsSync(walkthroughPath)) {
          const wtContent = fs.readFileSync(walkthroughPath, 'utf-8');
          const hasReviewSection =
            wtContent.includes('レビュー指摘事項') ||
            wtContent.includes('改善対応履歴') ||
            wtContent.includes('Review Feedback') ||
            wtContent.includes('対応履歴');
          if (!hasReviewSection) {
            console.error(
              `\n❌ [成果レポート規約不備] ${dirName}/walkthrough.md に「レビュー指摘事項と改善対応履歴」セクションが存在しません。`
            );
            hasError = true;
          }
        }

        validCount++;
      }

      // 2.3 Verify docs/issues/README.md table
      const issuesReadmePath = path.join(issuesDir, 'README.md');
      if (!fs.existsSync(issuesReadmePath)) {
        console.error('\n❌ [Issue README 欠落] docs/issues/README.md が存在しません。');
        hasError = true;
      } else {
        const issuesReadmeContent = fs.readFileSync(issuesReadmePath, 'utf-8');
        for (const dirName of issueDirs) {
          const issueNum = dirName.split('_')[0];
          if (!issuesReadmeContent.includes(issueNum)) {
            console.error(`\n❌ [Issue 一覧未登録] ${dirName} が docs/issues/README.md のテーブルに登録されていません。`);
            hasError = true;
          }
        }
      }

      console.log(`    ✓ docs/issues/: 全 ${validCount} 件の Issue フォルダ構造・仕様書および進行中Issueの4ファイル完結性を確認済`);
    }
  }

  return !hasError;
}

// Standalone execution support
const isDirectExecution = process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();

if (isDirectExecution) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
  const ok = checkDocIntegrity(rootDir);
  process.exit(ok ? 0 : 1);
}
