/**
 * OpenAPI Sync Guard Hook (.agents/plugins/myhomestock/hooks/openapiSyncGuard.js)
 * 
 * Enforces OpenAPI Schema and TypeScript type synchronicity before git commit or gh pr create:
 * 1. Checks if docs/openapi.json and frontend/src/api/schema.d.ts exist.
 * 2. Checks if schema.d.ts contains required core schemas.
 * 3. Blocks commit/PR creation if schemas are out of sync or missing, providing clear remediation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const specPath = path.resolve(projectRoot, 'docs/openapi.json');
  const typePath = path.resolve(projectRoot, 'frontend/src/api/schema.d.ts');

  if (!fs.existsSync(specPath)) {
    return {
      decision: 'deny',
      reason: "[OpenApiSyncGuard Denied] docs/openapi.json does not exist. Ensure OpenAPI spec is present before committing.",
    };
  }

  if (!fs.existsSync(typePath)) {
    return {
      decision: 'deny',
      reason: "[OpenApiSyncGuard Denied] frontend/src/api/schema.d.ts does not exist. (Remediation Guidance: Run 'npm run sync-api' to generate TypeScript types.)",
    };
  }

  const typeContent = fs.readFileSync(typePath, 'utf8');
  const REQUIRED_SCHEMAS = ['StockItemResponseDto', 'StockItemRequestDto'];
  for (const schemaName of REQUIRED_SCHEMAS) {
    if (!typeContent.includes(schemaName)) {
      return {
        decision: 'deny',
        reason: `[OpenApiSyncGuard Denied] Required schema '${schemaName}' is missing in frontend/src/api/schema.d.ts. (Remediation Guidance: Run 'npm run sync-api' to re-synchronize types with OpenAPI spec.)`,
      };
    }
  }

  return { decision: 'allow' };
}

const isDirectExecution = process.argv[1] && 
  (fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase());

if (isDirectExecution) {
  readStdinJson().then((payload) => {
    const result = handleOpenApiSyncGuard(payload);
    writeStdoutJson(result);
    process.exit(0);
  });
}
