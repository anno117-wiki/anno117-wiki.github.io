import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// 計算機の翻訳（日本語・英語）のキーがそろっているかを調べる。
// 片方にしかないキーや空の値があると、画面にキー名（goods.xxx など）がそのまま出る。
// 調べるのは公開する docs/calculator/ の側。直すのは packages/shared/public/i18n/locales/ の側

const LOCALES = ['ja', 'en'] as const;
const SOURCE_DIR = 'packages/shared/public/i18n/locales';

// { a: { b: "x" } } -> { "a.b": "x" }
function flatten(value: unknown, prefix: string, out: Map<string, unknown>): void {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else {
    out.set(prefix, value);
  }
}

// キーの数を返す（読めなければ 0）。問題は errors に足す
export function checkI18nKeys(docsDir: string, errors: string[]): number {
  const maps = new Map<string, Map<string, unknown>>();
  for (const locale of LOCALES) {
    const path = resolve(docsDir, 'calculator/i18n/locales', `${locale}.json`);
    if (!existsSync(path)) return 0; // 計算機のデータの検査で報告済み
    try {
      const flat = new Map<string, unknown>();
      flatten(JSON.parse(readFileSync(path, 'utf-8')), '', flat);
      maps.set(locale, flat);
    } catch {
      return 0; // JSON として読めないことは、計算機のデータの検査で報告済み
    }
  }

  const ja = maps.get('ja')!;
  const en = maps.get('en')!;
  const report = (keys: string[], message: string): void => {
    if (keys.length === 0) return;
    errors.push(`${message} ${keys.length}件（${SOURCE_DIR}/ を直す）: ${keys.slice(0, 10).join('、')}${keys.length > 10 ? ' ほか' : ''}`);
  };

  report([...ja.keys()].filter((key) => !en.has(key)), '計算機の翻訳で、日本語にだけあるキー');
  report([...en.keys()].filter((key) => !ja.has(key)), '計算機の翻訳で、英語にだけあるキー');
  for (const [locale, map] of maps) {
    const empty = [...map].filter(([, value]) => typeof value !== 'string' || value.trim() === '').map(([key]) => key);
    report(empty, `計算機の翻訳（${locale}）で、値が空か文字でないキー`);
  }

  return ja.size;
}
