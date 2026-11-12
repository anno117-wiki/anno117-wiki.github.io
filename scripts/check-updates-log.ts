import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// 更新履歴（apps/wiki/docs/.vitepress/data/updates.json）の中身を調べる。
// 手で書き足すため、項目の書き忘れ・種類の打ち間違い・リンク先の誤り・日付の順番の入れ違いが起きやすい。

const UPDATES_PATH = 'apps/wiki/docs/.vitepress/data/updates.json';
const TYPES = new Set(['post', 'fix']); // UpdateLog.vue の BADGE_LABEL にある種類
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// サイト内のパスを docs/ の実ファイルに解決する関数（check-site.ts から渡す）
export type LinkResolver = (link: string) => boolean;

interface UpdateEntry {
  date?: unknown;
  type?: unknown;
  title?: unknown;
  link?: unknown;
  summary?: unknown;
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// 件数を返す。問題は errors に足す
export function checkUpdatesLog(repoRoot: string, linkExists: LinkResolver, errors: string[]): number {
  const path = resolve(repoRoot, UPDATES_PATH);
  if (!existsSync(path)) {
    errors.push(`更新履歴がありません: ${UPDATES_PATH}`);

    return 0;
  }

  let entries: UpdateEntry[];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(parsed)) throw new Error('配列ではありません');
    entries = parsed;
  } catch (error) {
    errors.push(`更新履歴が JSON として読めません: ${UPDATES_PATH}（${String(error)}）`);

    return 0;
  }

  const seen = new Set<string>();
  entries.forEach((entry, i) => {
    const where = `更新履歴の${i + 1}件目「${isText(entry.title) ? entry.title : '（タイトルなし）'}」`;
    if (!isText(entry.date) || !isValidDate(entry.date)) errors.push(`${where}: 日付が YYYY-MM-DD の形ではありません（${String(entry.date)}）`);
    if (!isText(entry.type) || !TYPES.has(entry.type)) errors.push(`${where}: 種類は post か fix にしてください（${String(entry.type)}）`);
    if (!isText(entry.title)) errors.push(`${where}: タイトルがありません`);
    if (!isText(entry.summary)) errors.push(`${where}: 説明（summary）がありません`);

    // リンクは無くてもよい（表示側が対応している）。あるときはサイト内の実在するページを指すこと
    if (entry.link !== undefined) {
      if (!isText(entry.link) || !entry.link.startsWith('/')) {
        errors.push(`${where}: リンクは / で始まるサイト内のパスにしてください（${String(entry.link)}）`);
      } else if (!linkExists(entry.link)) {
        errors.push(`${where}: リンク先のページがありません（${entry.link}）`);
      }
    }

    const key = `${String(entry.date)} ${String(entry.title)}`;
    if (seen.has(key)) errors.push(`${where}: 同じ日付・タイトルの項目が2つあります`);
    seen.add(key);

    // 新しい順（先頭が最新）。同じ日付が続くのはよい
    const previous = entries[i - 1];
    if (previous && isText(previous.date) && isText(entry.date) && entry.date > previous.date) {
      errors.push(`${where}: 日付が新しい順になっていません（${previous.date} の後に ${entry.date}）。新しい項目は先頭に足してください`);
    }
  });

  return entries.length;
}
