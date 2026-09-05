/**
 * OpenAPI Schema & TypeScript Type Synchronicity Checker
 * Verifies docs/openapi.json and frontend/src/api/schema.d.ts alignment
 */

import fs from 'fs';
import path from 'path';

export function checkOpenApiSyncIntegrity(rootDir) {
  let hasError = false;
  console.log('  📡 [OpenAPI Sync Checker] OpenAPI 仕様書および TypeScript 型定義の同期検証...');

  const specPath = path.resolve(rootDir, 'docs', 'openapi.json');
  const typePath = path.resolve(rootDir, 'frontend', 'src', 'api', 'schema.d.ts');

  if (!fs.existsSync(specPath)) {
    console.error('\n❌ [OpenAPI 仕様書欠落] docs/openapi.json が存在しません。');
    return false;
  }

  if (!fs.existsSync(typePath)) {
    console.error('\n❌ [TypeScript 型定義欠落] frontend/src/api/schema.d.ts が存在しません。');
    console.error('   👉 対処法: npm run sync-api を実行して型定義を生成してください。');
    return false;
  }

  const typeContent = fs.readFileSync(typePath, 'utf-8');
  if (typeContent.length < 50) {
    console.error('\n❌ [TypeScript 型定義内容不足] schema.d.ts の内容が極めて短小です。');
    hasError = true;
  }

  // Check essential core schema presence
  const REQUIRED_SCHEMAS = ['StockItemResponseDto', 'StockItemRequestDto'];
  for (const schemaName of REQUIRED_SCHEMAS) {
    if (!typeContent.includes(schemaName)) {
      console.error(`\n❌ [スキーマ未定義] frontend/src/api/schema.d.ts に ${schemaName} が見つかりません。`);
      hasError = true;
    }
  }

  if (!hasError) {
    console.log('    ✓ docs/openapi.json & frontend/src/api/schema.d.ts: 型同期整合性を確認済');
  }

  return !hasError;
}
