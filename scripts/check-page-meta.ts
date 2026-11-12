import { readFileSync } from 'fs';
import { relative, basename } from 'path';

// 各ページのタイトル（<title>）と説明文（meta description）を調べる。
// 検索結果に出るため、空のもの・ほかのページと同じものが無いようにする。

const SITE_NAME = 'Anno 117攻略Wiki';
// 検索結果に出さないページ（404 と Search Console の確認用ファイル）
const isExcluded = (file: string): boolean => basename(file) === '404.html' || /^google[0-9a-f]+\.html$/.test(basename(file));

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function readMeta(html: string): { title: string; description: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  // 属性の順番や改行に左右されないよう、meta タグを1つずつ見る
  let description = '';
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (/\bname\s*=\s*["']description["']/i.test(tag)) {
      description = tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1] ?? '';
      break;
    }
  }

  return { title: decodeEntities(title), description: decodeEntities(description) };
}

// 調べたページ数を返す。問題は errors に足す
export function checkPageMeta(docsDir: string, htmlFiles: string[], errors: string[]): number {
  const byTitle = new Map<string, string[]>();
  const byDescription = new Map<string, string[]>();
  let checked = 0;

  for (const file of htmlFiles) {
    if (isExcluded(file)) continue;
    const page = `docs/${relative(docsDir, file).replace(/\\/g, '/')}`;
    let meta: { title: string; description: string };
    try {
      meta = readMeta(readFileSync(file, 'utf-8'));
    } catch (error) {
      errors.push(`ページを読めません: ${page}（${String(error)}）`);
      continue;
    }
    checked++;

    const pageTitle = meta.title.replace(new RegExp(`\\s*\\|\\s*${SITE_NAME}$`), '').trim();
    if (pageTitle === '' || pageTitle === SITE_NAME) errors.push(`タイトルがありません: ${page}（frontmatter の title を書く）`);
    if (meta.description === '') errors.push(`説明文（description）がありません: ${page}（frontmatter の description を書く）`);

    if (meta.title) byTitle.set(meta.title, [...(byTitle.get(meta.title) ?? []), page]);
    if (meta.description) byDescription.set(meta.description, [...(byDescription.get(meta.description) ?? []), page]);
  }

  for (const [title, pages] of byTitle) {
    if (pages.length > 1) errors.push(`タイトルが同じページがあります「${title}」: ${pages.join('、')}`);
  }
  for (const [description, pages] of byDescription) {
    if (pages.length > 1) errors.push(`説明文が同じページがあります「${description.slice(0, 40)}…」: ${pages.join('、')}`);
  }

  return checked;
}
