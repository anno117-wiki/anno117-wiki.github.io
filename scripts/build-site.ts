import { build, mergeConfig, loadConfigFromFile } from 'vite';
import { execSync } from 'child_process';
import { rmSync, mkdirSync, cpSync, writeFileSync, existsSync } from 'fs';
import { resolve, pathToFileURL } from 'path';

const root = resolve(import.meta.dir, '..');
const docsDir = resolve(root, 'docs');
const wikiDist = resolve(root, 'apps/wiki/docs/.vitepress/dist');

// Step 1: docs/ をクリーン
console.log('[1/4] Cleaning docs/...');
if (existsSync(docsDir)) rmSync(docsDir, { recursive: true, force: true });
mkdirSync(docsDir, { recursive: true });

// Step 2: calculator → docs/calculator/
console.log('[2/4] Building calculator (base=/calculator/)...');
const configResult = await loadConfigFromFile(
  { command: 'build', mode: 'production' },
  resolve(root, 'vite.config.ts'),
  root
);
const calculatorConfig = mergeConfig(configResult!.config, {
  base: '/calculator/',
  build: {
    outDir: resolve(root, 'docs/calculator'),
    emptyOutDir: true,
  },
});
await build(calculatorConfig);

// Step 3: wiki → apps/wiki/docs/.vitepress/dist → docs/
console.log('[3/4] Building wiki...');
execSync('bun run build', { cwd: resolve(root, 'apps/wiki'), stdio: 'inherit' });
cpSync(wikiDist, docsDir, { recursive: true });

// Step 4: .nojekyll
console.log('[4/4] Placing .nojekyll...');
writeFileSync(resolve(docsDir, '.nojekyll'), '');

console.log('Done. docs/ = wiki(/) + calculator(/calculator/)');
