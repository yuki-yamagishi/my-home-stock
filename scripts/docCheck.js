/**
 * Automated Document & Harness Integrity Checker (Orchestrator)
 * Coordinates specialized checkers: adrChecker, agentSkillChecker, issueDocChecker, openapiSyncChecker
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { checkAdrIntegrity } from './checkers/adrChecker.js';
import { checkAgentSkillIntegrity } from './checkers/agentSkillChecker.js';
import { checkIssueDocIntegrity } from './checkers/issueDocChecker.js';
import { checkOpenApiSyncIntegrity } from './checkers/openapiSyncChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.resolve(PROJECT_ROOT, 'docs');

console.log('📝 Running Automated Document & Harness Integrity Check...\n');

let allPassed = true;

// 1. Check ADRs
const adrOk = checkAdrIntegrity(DOCS_DIR);
if (!adrOk) allPassed = false;

// 2. Check Agent & Skill Synchronicity
const agentSkillOk = checkAgentSkillIntegrity(PROJECT_ROOT);
if (!agentSkillOk) allPassed = false;

// 3. Check Issue Docs & Root Docs
const issueDocOk = checkIssueDocIntegrity(DOCS_DIR);
if (!issueDocOk) allPassed = false;

// 4. Check OpenAPI Schema & TypeScript Type Synchronicity
const openApiOk = checkOpenApiSyncIntegrity(PROJECT_ROOT);
if (!openApiOk) allPassed = false;

if (!allPassed) {
  console.error('\n🚫 Document & Harness Integrity Check FAILED: ドキュメントまたはハーネス設定に不整合が検知されました。\n');
  process.exit(1);
}

console.log('\n✅ Document & Harness Integrity Check PASSED: 全ての整合性検証に合格しました。\n');
process.exit(0);
