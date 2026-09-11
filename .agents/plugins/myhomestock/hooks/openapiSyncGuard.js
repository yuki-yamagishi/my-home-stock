/**
 * OpenAPI Sync Guard Hook (.agents/plugins/myhomestock/hooks/openapiSyncGuard.js)
 * 
 * Enforces OpenAPI Schema and TypeScript type synchronicity:
 * 1. Used as a PreToolUse Lifecycle Hook before git commit / gh pr create
 * 2. Used as a verification function (checkOpenApiSync) during CI / quality gate runs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Pure verification logic: checks docs/openapi.json and frontend/src/api/schema.d.ts
 * Uses console.error / stderr for logging so stdout remains clean for AGY hook JSON.
 */
export function checkOpenApiSync(projectRoot, options = {}) {
  const silent = Boolean(options.silent);
  if (!silent) {
    console.error('  📡 [OpenAPI Sync Guard] OpenAPI 仕様書および TypeScript 型定義の同期検証...');
  }
  let hasError = false;

  const specPath = path.resolve(projectRoot, 'docs', 'openapi.json');
  const typePath = path.resolve(projectRoot, 'frontend', 'src', 'api', 'schema.d.ts');

  if (!fs.existsSync(specPath)) {
    if (!silent) console.error('\n❌ [OpenAPI 仕様書欠落] docs/openapi.json が存在しません。');
    return false;
  }

  if (!fs.existsSync(typePath)) {
    if (!silent) {
      console.error('\n❌ [TypeScript 型定義欠落] frontend/src/api/schema.d.ts が存在しません。');
      console.error('   👉 対処法: npm run sync-api を実行して型定義を生成してください。');
    }
    return false;
  }

  const typeContent = fs.readFileSync(typePath, 'utf-8');
  if (typeContent.length < 50) {
    if (!silent) console.error('\n❌ [TypeScript 型定義内容不足] schema.d.ts の内容が極めて短小です。');
    hasError = true;
  }

  const REQUIRED_SCHEMAS = ['StockItemResponseDto', 'StockItemRequestDto'];
  for (const schemaName of REQUIRED_SCHEMAS) {
    if (!typeContent.includes(schemaName)) {
      if (!silent) console.error(`\n❌ [スキーマ未定義] frontend/src/api/schema.d.ts に ${schemaName} が見つかりません。`);
      hasError = true;
    }
  }

  if (!hasError && !silent) {
    console.error('    ✓ docs/openapi.json & frontend/src/api/schema.d.ts: 型同期整合性を確認済');
  }

  return !hasError;
}

function readStdinJson(timeoutMs = 2000) {
  return new Promise((resolve) => {
    let raw = '';
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({});
      }
    }, timeoutMs);
    if (timer.unref) timer.unref();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { raw += chunk; });
    process.stdin.on('end', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        try {
          const trimmed = raw.trim();
          resolve(trimmed ? JSON.parse(trimmed) : {});
        } catch {
          resolve({});
        }
      }
    });
    process.stdin.on('error', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({});
      }
    });
  });
}

function writeStdoutJson(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function findProjectRoot(startDir) {
  let cur = path.resolve(startDir);
  while (cur && path.dirname(cur) !== cur) {
    if (fs.existsSync(path.join(cur, 'package.json')) && fs.existsSync(path.join(cur, '.git'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return path.resolve(startDir, '../../../..');
}

/**
 * Lifecycle Hook handler (PreToolUse)
 */
export function handleOpenApiSyncGuard(payload = {}, options = {}) {
  const toolCall = payload.toolCall || {};
  const toolName = toolCall.name || '';
  const args = toolCall.args || {};
  const commandLine = args.CommandLine || '';

  if (toolName !== 'run_command' || !commandLine) {
    return { decision: 'allow' };
  }

  const trimmed = commandLine.trim();
  const isCommitOrPr = /\bgit\s+commit\b/i.test(trimmed) || /\bgh\s+pr\s+create\b/i.test(trimmed);
  if (!isCommitOrPr) {
    return { decision: 'allow' };
  }

  const projectRoot = options.projectRoot || findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));
  const ok = checkOpenApiSync(projectRoot, { silent: true });

  if (!ok) {
    return {
      decision: 'deny',
      reason: "[OpenApiSyncGuard Denied] OpenAPI schema or frontend types are missing/out-of-sync. (Remediation Guidance: Run 'npm run sync-api' to re-synchronize types.)",
    };
  }

  return { decision: 'allow' };
}

const isDirectExecution = process.argv[1] && 
  (fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase());

if (isDirectExecution) {
  // Check if explicitly called via CLI flag
  if (process.argv.includes('--cli') || process.argv.includes('--check')) {
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
    const ok = checkOpenApiSync(rootDir);
    process.exit(ok ? 0 : 1);
  } else {
    // AGY Lifecycle Hook execution (default for direct execution)
    readStdinJson().then((payload) => {
      const result = handleOpenApiSyncGuard(payload);
      writeStdoutJson(result);
      process.exit(0);
    });
  }
}
