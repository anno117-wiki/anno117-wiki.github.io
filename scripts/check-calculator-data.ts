import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, relative } from 'path';

// 計算機（docs/calculator/）が画面を開いてから読み込むデータと画像を調べる。
// HTML には出てこないため、check-site.ts のリンク切れ検査では見つからないものを補う。
//   (1) データが指す画像が実在するか（商品一覧・生産チェーン・アイテム対応表のアイコン、建設費・維持費の資材アイコン）
//   (2) 読み込むデータが実在し、JSON として読めるか

// 計算機が固定のパスで読み込むデータ（packages/shared/src の fetch 先）
const REQUIRED_DATA = [
  'productions/list.json',
  'productions/item-compatibility.json',
  'data/categories.json',
  'i18n/locales/ja.json',
  'i18n/locales/en.json',
];

// 生産チェーンのファイルのうち、チェーン本体ではないもの
const NON_CHAIN_FILES = new Set(['list.json', 'item-compatibility.json']);

// 資材アイコンになる費用の欄（maintanance はデータ側の綴りのまま）
const COST_KEYS = ['building_cost', 'maintanance_cost'];

export interface CalculatorCheckResult {
  jsonFiles: number;
  iconRefs: number;
}

interface GoodsListEntry {
  id: string;
  icon?: string;
  files?: Record<string, string>;
}

function readJson(path: string, label: string, errors: string[]): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    errors.push(`JSON として読めません: ${label}（${String(error)}）`);

    return undefined;
  }
}

function listJsonFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'assets') files.push(...listJsonFiles(full));
    } else if (entry.name.endsWith('.json')) {
      files.push(full);
    }
  }

  return files;
}

// 生産チェーンの各段（id と、input・time・burning_time のいずれかを持つもの）を集める
function collectChainNodes(value: unknown, nodes: Record<string, unknown>[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectChainNodes(item, nodes);

    return;
  }
  if (!value || typeof value !== 'object') return;

  const node = value as Record<string, unknown>;
  if (typeof node.id === 'string' && ('input' in node || 'time' in node || 'burning_time' in node)) {
    nodes.push(node);
  }
  for (const child of Object.values(node)) collectChainNodes(child, nodes);
}

// "icon" の値を全て集める（item-compatibility.json 用）
function collectIconValues(value: unknown, icons: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectIconValues(item, icons);

    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (key === 'icon' && typeof child === 'string') icons.push(child);
    else collectIconValues(child, icons);
  }
}

export function checkCalculatorData(docsDir: string, errors: string[]): CalculatorCheckResult {
  const calcDir = resolve(docsDir, 'calculator');
  const result: CalculatorCheckResult = { jsonFiles: 0, iconRefs: 0 };
  if (!existsSync(calcDir)) return result; // 必須ファイルの検査で報告済み

  // (2) 固定パスのデータの実在と、全 JSON の読み込み
  for (const path of REQUIRED_DATA) {
    if (!existsSync(resolve(calcDir, path))) errors.push(`計算機のデータがありません: docs/calculator/${path}`);
  }

  const parsed = new Map<string, unknown>();
  for (const file of listJsonFiles(calcDir)) {
    const rel = relative(calcDir, file).replace(/\\/g, '/');
    parsed.set(rel, readJson(file, `docs/calculator/${rel}`, errors));
  }
  result.jsonFiles = parsed.size;

  const list = parsed.get('productions/list.json') as { goods?: GoodsListEntry[] } | undefined;
  const goods = Array.isArray(list?.goods) ? list.goods : [];
  if (list !== undefined && goods.length === 0) errors.push('計算機の商品一覧（productions/list.json）に商品がありません');

  // 商品一覧が指す生産チェーンのファイル
  for (const good of goods) {
    for (const file of Object.values(good.files ?? {})) {
      if (!parsed.has(`productions/${file}.json`)) {
        errors.push(`計算機の生産チェーンのファイルがありません: productions/${file}.json（商品 ${good.id}）`);
      }
    }
  }

  // (1) データが指す画像。計算機は商品一覧のアイコン名を優先し、無ければ ID を使う（ProductionChainView.ts 等）
  const iconById = new Map(goods.filter((g) => g.icon).map((g) => [g.id, g.icon as string]));
  const missingIcons = new Map<string, string>(); // アイコン名 → 最初に見つかった参照元
  const requireIcon = (icon: string, source: string): void => {
    result.iconRefs++;
    if (!missingIcons.has(icon) && !existsSync(resolve(calcDir, 'icons', `${icon}.png`))) {
      missingIcons.set(icon, source);
    }
  };

  for (const good of goods) {
    if (good.icon) requireIcon(good.icon, 'productions/list.json');
  }

  for (const [rel, data] of parsed) {
    const fileName = rel.slice('productions/'.length);
    if (!rel.startsWith('productions/') || NON_CHAIN_FILES.has(fileName)) continue;

    const nodes: Record<string, unknown>[] = [];
    collectChainNodes(data, nodes);
    for (const node of nodes) {
      const id = node.id as string;
      const icon = iconById.get(id) ?? (typeof node.icon === 'string' ? node.icon : id);
      requireIcon(icon, rel);
      for (const key of COST_KEYS) {
        const costs = node[key];
        if (costs && typeof costs === 'object') {
          for (const resource of Object.keys(costs)) requireIcon(resource, `${rel} の ${key}`);
        }
      }
    }
  }

  const compatIcons: string[] = [];
  collectIconValues(parsed.get('productions/item-compatibility.json'), compatIcons);
  for (const icon of compatIcons) requireIcon(icon, 'productions/item-compatibility.json');

  for (const [icon, source] of missingIcons) {
    errors.push(`計算機の画像がありません: docs/calculator/icons/${icon}.png（参照元 ${source}）`);
  }

  return result;
}
