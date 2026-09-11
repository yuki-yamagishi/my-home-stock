/**
 * Antigravity Plugin & Submodule Integrity Checker
 * Verifies that the git submodule (.agents/plugins/antigravity-review-loop)
 * and the custom plugin (.agents/plugins/myhomestock) are properly deployed and initialized.
 */

import fs from 'fs';
import path from 'path';

export function checkPluginIntegrity(projectRoot) {
  console.log('  🔍 [Plugin Checker] Antigravity プラグイン & Submodule 配備状況の検証...');
  let hasError = false;

  const pluginsDir = path.resolve(projectRoot, '.agents', 'plugins');
  const reviewLoopDir = path.join(pluginsDir, 'antigravity-review-loop');
  const myHomeStockDir = path.join(pluginsDir, 'myhomestock');

  // 1. Check Submodule: antigravity-review-loop
  const reviewLoopPluginJson = path.join(reviewLoopDir, 'plugin.json');
  const reviewLoopHooksJson = path.join(reviewLoopDir, 'hooks.json');

  if (!fs.existsSync(reviewLoopDir) || !fs.existsSync(reviewLoopPluginJson) || !fs.existsSync(reviewLoopHooksJson)) {
    console.error('\n❌ [Plugin Checker] Git Submodule (.agents/plugins/antigravity-review-loop) が初期化・展開されていません。');
    console.error('   👉 解決コマンド: git submodule update --init --recursive を実行してください。\n');
    hasError = true;
  }

  // 2. Check Custom Plugin: myhomestock
  const myHomeStockPluginJson = path.join(myHomeStockDir, 'plugin.json');
  const myHomeStockConstraints = path.join(myHomeStockDir, 'rules', 'domain-constraints.md');

  if (!fs.existsSync(myHomeStockDir) || !fs.existsSync(myHomeStockPluginJson) || !fs.existsSync(myHomeStockConstraints)) {
    console.error('\n❌ [Plugin Checker] MyHomeStock 専用プラグイン (.agents/plugins/myhomestock) のマニフェストまたは不変則ルールが不足しています。');
    hasError = true;
  }

  if (hasError) {
    return false;
  }

  console.log('    ✓ プラグインおよび Submodule は正常に展開されています。');
  return true;
}
