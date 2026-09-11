/**
 * Quality Gate Runner (.agents/plugins/myhomestock/hooks/qualityGateRunner.js)
 * 
 * Orchestrates all domain, document, and security integrity guards for MyHomeStock.
 * Invoked by:
 * - GitHub Actions CI (quality-gate job)
 * - Git Hooks (.githooks/pre-commit)
 * - npm run check (Outer Loop)
 * 
 * CLI Flags:
 *   --fast         : Skip full recursive secret scan if only quick doc check is needed
 *   --docs-only    : Run only ADR, Issue 4-doc, and OpenAPI checks
 *   --secrets-only : Run only secret and credential scan
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { scanSecrets } from './secretLeakGuard.js';
import { checkPluginDeployment } from './pluginDeploymentGuard.js';
import { checkDocIntegrity } from './docIntegrityGuard.js';
import { checkOpenApiSync } from './openapiSyncGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const args = process.argv.slice(2);
const isFast = args.includes('--fast');
const isDocsOnly = args.includes('--docs-only');
const isSecretsOnly = args.includes('--secrets-only');

console.log('🏛️  Running MyHomeStock Quality Gate Guards...\n');

let allPassed = true;

// 1. Secret & Credential Leak Scanner (unless --docs-only)
if (!isDocsOnly) {
  const secretsOk = scanSecrets(PROJECT_ROOT);
  if (!secretsOk) allPassed = false;
}

if (!isSecretsOnly) {
  console.log('📝 Running Document, Architecture & Plugin Integrity Verification...\n');

  // 2. Plugin & Submodule Deployment Guard
  const pluginOk = checkPluginDeployment(PROJECT_ROOT);
  if (!pluginOk) allPassed = false;

  // 3. Document (ADR & Issue 4-Doc) Integrity Guard
  const docOk = checkDocIntegrity(PROJECT_ROOT);
  if (!docOk) allPassed = false;

  // 4. OpenAPI Schema & TypeScript Type Synchronicity Guard
  const openApiOk = checkOpenApiSync(PROJECT_ROOT);
  if (!openApiOk) allPassed = false;
}

if (!allPassed) {
  console.error('\n🚫 Quality Gate FAILED: 整合性エラーまたはセキュリティ警告が検知されました。\n');
  process.exit(1);
}

console.log('\n✅ Quality Gate PASSED: 全てのプラグインガード・ドキュメント整合性検証に合格しました。\n');
process.exit(0);
