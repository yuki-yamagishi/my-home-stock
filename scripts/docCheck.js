/**
 * Automated Document Integrity & Completeness Check
 * Verifies docs/pre_phase_verification.md, docs/implementation_plan.md, docs/walkthrough.md, docs/architecture.md, docs/adr/, and docs/issues/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DOCS_DIR = path.resolve(rootDir, 'docs');
const ADR_DIR = path.resolve(DOCS_DIR, 'adr');
const ISSUES_DIR = path.resolve(DOCS_DIR, 'issues');

const REQUIRED_DOCS = [
  {
    filename: 'pre_phase_verification.md',
    title: '4軸事前検証ログ (Pre-Phase Verification)',
    requiredSections: ['事前検証', '技術', 'UX', '永続性', 'テスト'],
  },
  {
    filename: 'implementation_plan.md',
    title: '実装計画書 (Implementation Plan)',
    requiredSections: ['変更', '検証'],
  },
  {
    filename: 'walkthrough.md',
    title: '実装成果レポート (Walkthrough)',
    requiredSections: ['成果', '検証'],
  },
  {
    filename: 'architecture.md',
    title: 'アーキテクチャ設計書 (Architecture)',
    requiredSections: ['アーキテクチャ', 'フロントエンド', 'バックエンド', 'データベース'],
  },
];

console.log('📝 Running Automated Document Integrity & Completeness Check...');

if (!fs.existsSync(DOCS_DIR)) {
  console.error('\n❌ ERROR: docs/ directory does not exist.');
  process.exit(1);
}

let hasError = false;

// 1. Check primary required documents
for (const doc of REQUIRED_DOCS) {
  const filePath = path.join(DOCS_DIR, doc.filename);

  // File existence check
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ [ドキュメント欠落] ${doc.filename} が存在しません。`);
    console.error(`   👉 対処法: docs/${doc.filename} を作成し、${doc.title} を記述してください。`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8').trim();

  // Empty or minimal content check
  if (content.length < 50) {
    console.error(`\n❌ [ドキュメント内容不足] ${doc.filename} の内容が極めて短小です (${content.length}文字)。`);
    console.error(`   👉 対処法: docs/${doc.filename} に詳細な設計・検証内容を記述してください。`);
    hasError = true;
    continue;
  }

  // Required sections / keywords check
  const missingKeywords = [];
  for (const keyword of doc.requiredSections) {
    if (!content.includes(keyword)) {
      missingKeywords.push(keyword);
    }
  }

  if (missingKeywords.length > 0) {
    console.error(`\n❌ [ドキュメント構造不整合] ${doc.filename} に必須セクション・要素が見つかりません:`);
    console.error(`   不足キーワード: ${missingKeywords.join(', ')}`);
    console.error(`   👉 対処法: docs/${doc.filename} に該当セクションを追記してください。`);
    hasError = true;
    continue;
  }

  console.log(`  ✓ docs/${doc.filename} (${doc.title}): 正常・整合性確認済`);
}

// 2. Check ADR directory and ADR README index completeness
if (fs.existsSync(ADR_DIR)) {
  const adrReadmePath = path.join(ADR_DIR, 'README.md');
  if (!fs.existsSync(adrReadmePath)) {
    console.error('\n❌ [ADR インデックス欠落] docs/adr/README.md が存在しません。');
    hasError = true;
  } else {
    const adrReadmeContent = fs.readFileSync(adrReadmePath, 'utf-8');
    const adrFiles = fs.readdirSync(ADR_DIR).filter((file) => {
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
      console.error(`\n❌ [ADR インデックス未登録] 以下の ADR が docs/adr/README.md に登録されていません:`);
      for (const unlisted of unlistedAdrs) {
        console.error(`   - ${unlisted}`);
      }
      console.error('   👉 対処法: docs/adr/README.md の一覧テーブルに追記してください。');
      hasError = true;
    } else {
      console.log(`  ✓ docs/adr/ (${adrFiles.length} 件の ADR 全てがインデックス登録確認済)`);
    }
  }
} else {
  console.error('\n❌ [ADR ディレクトリ欠落] docs/adr/ が存在しません。');
  hasError = true;
}

// 3. Check Issues directory and Issues README index completeness
if (fs.existsSync(ISSUES_DIR)) {
  const issuesReadmePath = path.join(ISSUES_DIR, 'README.md');
  if (!fs.existsSync(issuesReadmePath)) {
    console.error('\n❌ [Issue インデックス欠落] docs/issues/README.md が存在しません。');
    hasError = true;
  } else {
    const issuesReadmeContent = fs.readFileSync(issuesReadmePath, 'utf-8');
    const issueFiles = fs.readdirSync(ISSUES_DIR).filter((file) => {
      return file.endsWith('.md') && file !== 'README.md' && file !== '0000-template.md';
    });

    const unlistedIssues = [];
    for (const issueFile of issueFiles) {
      const issueMatch = issueFile.match(/^ISSUE-(\d+)/i);
      const issueNumber = issueMatch ? `ISSUE-${issueMatch[1]}` : issueFile;

      if (!issuesReadmeContent.includes(issueFile) && !issuesReadmeContent.includes(issueNumber)) {
        unlistedIssues.push(`${issueFile} (${issueNumber})`);
      }
    }

    if (unlistedIssues.length > 0) {
      console.error(`\n❌ [Issue インデックス未登録] 以下の Issue が docs/issues/README.md に登録されていません:`);
      for (const unlisted of unlistedIssues) {
        console.error(`   - ${unlisted}`);
      }
      console.error('   👉 対処法: docs/issues/README.md の一覧テーブルに追記してください。');
      hasError = true;
    } else {
      console.log(`  ✓ docs/issues/ (${issueFiles.length} 件の Issue 全てがインデックス登録確認済)`);
    }
  }
}

if (hasError) {
  console.error('\n❌ Document Integrity Check FAILED. Please resolve the above issues.\n');
  process.exit(1);
} else {
  console.log('\n✅ Document Integrity Check PASSED: 全ての設計・検証ドキュメント、ADR、および Issue の整合性が確認されました。\n');
}
