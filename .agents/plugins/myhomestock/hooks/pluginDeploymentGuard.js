/**
 * Plugin Deployment Guard (.agents/plugins/myhomestock/hooks/pluginDeploymentGuard.js)
 * Verifies that the Git Submodule (antigravity-review-loop) and the custom plugin (myhomestock)
 * are properly initialized, deployed, and not in an uninitialized/empty bypass state.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function checkPluginDeployment(projectRoot) {
  console.log('  🔍 [Plugin Guard] Antigravity プラグイン & Submodule 配備状況の検証...');
  let hasError = false;

  const pluginsDir = path.resolve(projectRoot, '.agents', 'plugins');
  const reviewLoopDir = path.join(pluginsDir, 'antigravity-review-loop');
  const myHomeStockDir = path.join(pluginsDir, 'myhomestock');

  // 1. Check Submodule: antigravity-review-loop
  const reviewLoopPluginJson = path.join(reviewLoopDir, 'plugin.json');
  const reviewLoopHooksJson = path.join(reviewLoopDir, 'hooks.json');

  if (!fs.existsSync(reviewLoopDir) || !fs.existsSync(reviewLoopPluginJson) || !fs.existsSync(reviewLoopHooksJson)) {
    console.error('\n❌ [Plugin Guard] Git Submodule (.agents/plugins/antigravity-review-loop) が初期化・展開されていません。');
    console.error('   👉 解決コマンド: git submodule update --init --recursive を実行してください。\n');
    hasError = true;
  }

  // 2. Check Custom Plugin: myhomestock
  const myHomeStockPluginJson = path.join(myHomeStockDir, 'plugin.json');
  const myHomeStockConstraints = path.join(myHomeStockDir, 'rules', 'domain-constraints.md');

  if (!fs.existsSync(myHomeStockDir) || !fs.existsSync(myHomeStockPluginJson) || !fs.existsSync(myHomeStockConstraints)) {
    console.error('\n❌ [Plugin Guard] MyHomeStock 専用プラグイン (.agents/plugins/myhomestock) のマニフェストまたは不変則ルールが不足しています。');
    hasError = true;
  }

  if (hasError) {
    return false;
  }

  console.log('    ✓ プラグインおよび Submodule は正常に展開されています。');
  return true;
}

// Standalone execution support
const isDirectExecution = process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();

if (isDirectExecution) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
  const ok = checkPluginDeployment(rootDir);
  process.exit(ok ? 0 : 1);
}
