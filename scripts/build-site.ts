import { build, mergeConfig, loadConfigFromFile } from 'vite';
import { execSync } from 'child_process';
import { rmSync, mkdirSync, cpSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve, pathToFileURL } from 'path';

const root = resolve(import.meta.dir, '..');
const docsDir = resolve(root, 'docs');
const wikiDist = resolve(root, 'apps/wiki/docs/.vitepress/dist');

// Step 0: 一次データ(_local/anno-official-data)より生成物が古くないか確認する（警告のみ、ビルドは止めない）。
// build-buildings-data.py / build-items-ja.py 等の生成スクリプトが一次ソース更新後に
// 再実行されないまま放置される事故（DLC02データが手編集のみで一次ソースに未反映等）を検知する。
console.log('[0/5] Checking generated data freshness...');
checkDataFreshness();

function checkDataFreshness(): void {
  const pairs: Array<{ label: string; sources: string[]; outputs: string[] }> = [
    {
      label: '建物データ（tools/build-buildings-data.py）',
      sources: [
        resolve(root, '_local/anno-official-data/config/export/assets.xml'),
        resolve(root, '_local/anno-official-data/official_master.csv'),
      ],
      outputs: [resolve(root, 'apps/wiki/docs/wiki/buildings-effects.json')],
    },
    {
      label: 'アイテムデータ（tools/build-items-ja.py, tools/build-calculator-items.py）',
      sources: [resolve(root, '_local/anno-official-data/v2.0.0.1/items_export_with_effects.csv')],
      outputs: [
        resolve(root, 'packages/shared/public/data/items-full.json'),
        resolve(root, 'packages/shared/public/productions/item-compatibility.json'),
      ],
    },
    {
      // apply-skilltree-connections.pyはtech["connections"]/annoS/annoRを無条件上書きするため、
      // 一次ソース更新後に再実行すると、DLC02手編集分の接続情報が古い値で潰される恐れがある。
      label: 'スキルツリー接続データ（tools/apply-skilltree-connections.py）',
      sources: [resolve(root, '_local/skilltree-full-data.json')],
      outputs: [resolve(root, 'apps/wiki/docs/wiki/techs.json')],
    },
  ];

  for (const { label, sources, outputs } of pairs) {
    const sourceMtimes = sources.filter(existsSync).map((p) => statSync(p).mtimeMs);
    const outputMtimes = outputs.filter(existsSync).map((p) => statSync(p).mtimeMs);
    if (sourceMtimes.length === 0 || outputMtimes.length === 0) continue;
    const newestSource = Math.max(...sourceMtimes);
    const oldestOutput = Math.min(...outputMtimes);
    if (newestSource > oldestOutput) {
      console.warn(`  [WARN] ${label}: 一次ソースが生成物より新しいです。再生成スクリプトの実行を検討してください。`);
    }
  }
}

// Step 1: docs/ をクリーン
console.log('[1/5] Cleaning docs/...');
if (existsSync(docsDir)) rmSync(docsDir, { recursive: true, force: true });
mkdirSync(docsDir, { recursive: true });

// Step 2: calculator → docs/calculator/
console.log('[2/5] Building calculator (base=/calculator/)...');
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
console.log('[3/5] Building wiki...');
execSync('bun run build', { cwd: resolve(root, 'apps/wiki'), stdio: 'inherit' });
cpSync(wikiDist, docsDir, { recursive: true });

// Step 4: .nojekyll
console.log('[4/5] Placing .nojekyll...');
writeFileSync(resolve(docsDir, '.nojekyll'), '');

console.log('Done. docs/ = wiki(/) + calculator(/calculator/)');
