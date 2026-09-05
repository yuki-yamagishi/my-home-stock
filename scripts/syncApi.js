/**
 * Automated OpenAPI 3.0 to TypeScript Type Synchronization Script
 * Fetches OpenAPI schema from live SpringDoc backend (or uses docs/openapi.json)
 * and generates type definitions for frontend using openapi-typescript.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const OPENAPI_URL = 'http://localhost:8080/v3/api-docs';
const LOCAL_SPEC_PATH = path.resolve(rootDir, 'docs', 'openapi.json');
const OUTPUT_TYPES_PATH = path.resolve(rootDir, 'frontend', 'src', 'api', 'schema.d.ts');

console.log('🔄 Running OpenAPI 3.0 Schema & TypeScript Type Sync...');

async function syncApi() {
  let specPath = LOCAL_SPEC_PATH;

  try {
    console.log(`  🔍 Probing live SpringDoc endpoint: ${OPENAPI_URL} ...`);
    const res = await fetch(OPENAPI_URL, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      fs.writeFileSync(LOCAL_SPEC_PATH, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`  ✓ Live OpenAPI JSON fetched and updated at docs/openapi.json`);
    } else {
      console.log(`  ℹ️ Backend returned status ${res.status}. Falling back to docs/openapi.json`);
    }
  } catch {
    console.log(`  ℹ️ Live backend not reachable on port 8080. Using static baseline: docs/openapi.json`);
  }

  if (!fs.existsSync(specPath)) {
    console.error(`❌ Error: OpenAPI specification file not found at ${specPath}`);
    process.exit(1);
  }

  try {
    console.log(`  ⚡ Generating TypeScript types with openapi-typescript...`);
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execSync(`${npxCmd} openapi-typescript "${specPath}" -o "${OUTPUT_TYPES_PATH}"`, {
      cwd: path.resolve(rootDir, 'frontend'),
      stdio: 'inherit',
    });

    // Append convenience re-exports if needed
    let content = fs.readFileSync(OUTPUT_TYPES_PATH, 'utf-8');
    if (!content.includes('export type StockItem =')) {
      content += `
export type StockItem = components['schemas']['StockItemResponseDto'];
export type StockItemInput = components['schemas']['StockItemRequestDto'];
export type HealthResponse = components['schemas']['HealthResponseDto'];
`;
      fs.writeFileSync(OUTPUT_TYPES_PATH, content, 'utf-8');
    }

    console.log(`✅ OpenAPI TypeScript types successfully updated at: frontend/src/api/schema.d.ts\n`);
  } catch (err) {
    console.error(`❌ Failed to run openapi-typescript:`, err);
    process.exit(1);
  }
}

syncApi();
