import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, relative } from 'path';

// build:site の生成物（docs/）が公開できる状態かを機械的に確かめる。
// 「wiki が docs/ から消えたままコミット」「リンク切れのまま公開」を、目視に頼らず止めるのが目的。
// 単体実行: bun run check:site（ビルドはしない。今ある docs/ を調べるだけ）

const SITE_ORIGIN = 'https://anno117-wiki.github.io';

// build:site が正常なら docs/ に必ず存在するもの
const REQUIRED_OUTPUTS = [
  'index.html',
  '404.html',
  '.nojekyll',
  'robots.txt',
  'sitemap.xml',
  'wiki/index.html',
  'guide/getting-started.html',
  'calculator/index.html',
];

export interface SiteCheckResult {
  htmlFiles: number;
  linksChecked: number;
  errors: string[];
}

function listHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...listHtmlFiles(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }

  return files;
}

// サイト内のパスを docs/ 配下の実ファイルに解決する。見つからなければ null。
function resolveTarget(docsDir: string, fromFile: string, link: string): string | null {
  const pathPart = link.split('#')[0].split('?')[0];
  if (pathPart === '') return fromFile;

  let decoded: string;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    return null;
  }

  const target = decoded.startsWith('/')
    ? resolve(docsDir, `.${decoded}`)
    : resolve(dirname(fromFile), decoded);
  if (!existsSync(target)) {
    // GitHub Pages は拡張子なしのURL（/wiki/items）に .html を補って配信する
    const withExtension = `${target}.html`;

    return existsSync(withExtension) ? withExtension : null;
  }

  if (!statSync(target).isDirectory()) return target;
  const indexFile = resolve(target, 'index.html');

  return existsSync(indexFile) ? indexFile : null;
}

// 外部サイト・メール・データURL等は対象外。自サイトの絶対URLはパスに直して調べる。
function toInternalLink(link: string): string | null {
  if (link.startsWith(SITE_ORIGIN)) return link.slice(SITE_ORIGIN.length) || '/';
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(link)) return null;

  return link;
}

function checkRequiredOutputs(docsDir: string, errors: string[]): void {
  for (const path of REQUIRED_OUTPUTS) {
    if (!existsSync(resolve(docsDir, path))) errors.push(`必須ファイルがありません: docs/${path}`);
  }
}

function checkSitemap(docsDir: string, errors: string[]): void {
  const sitemapPath = resolve(docsDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return; // 必須ファイルの検査で報告済み

  const locs = [...readFileSync(sitemapPath, 'utf-8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) errors.push('sitemap.xml に <loc> が1件もありません');

  for (const loc of locs) {
    const link = toInternalLink(loc);
    if (link === null || !link.startsWith('/')) {
      errors.push(`sitemap.xml: 自サイト以外のURLです: ${loc}`);
    } else if (resolveTarget(docsDir, sitemapPath, link) === null) {
      errors.push(`sitemap.xml: 実ファイルがありません: ${loc}`);
    }
  }
}

function checkLinks(docsDir: string, htmlFiles: string[], errors: string[]): number {
  let linksChecked = 0;
  for (const file of htmlFiles) {
    // script内の文字列（埋め込みJSON等）にある href= を拾わないよう、先に取り除く
    const html = readFileSync(file, 'utf-8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const links = new Set([...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1]));

    for (const raw of links) {
      const link = toInternalLink(raw.replace(/&amp;/g, '&'));
      if (link === null) continue;

      linksChecked++;
      if (resolveTarget(docsDir, file, link) === null) {
        errors.push(`リンク切れ: docs/${relative(docsDir, file).replace(/\\/g, '/')} -> ${raw}`);
      }
    }
  }

  return linksChecked;
}

export function checkSite(docsDir: string): SiteCheckResult {
  const errors: string[] = [];
  if (!existsSync(docsDir)) {
    return { htmlFiles: 0, linksChecked: 0, errors: [`docs/ がありません: ${docsDir}`] };
  }

  checkRequiredOutputs(docsDir, errors);
  checkSitemap(docsDir, errors);
  const htmlFiles = listHtmlFiles(docsDir);
  const linksChecked = checkLinks(docsDir, htmlFiles, errors);

  return { htmlFiles: htmlFiles.length, linksChecked, errors };
}

// 結果を表示し、問題が無ければ true を返す。
export function reportSiteCheck(result: SiteCheckResult): boolean {
  if (result.errors.length === 0) {
    console.log(`  OK: HTML ${result.htmlFiles}件・サイト内リンク ${result.linksChecked}件に問題なし`);

    return true;
  }

  console.error(`  [ERROR] docs/ に ${result.errors.length}件の問題があります。コミット前に直してください。`);
  for (const error of result.errors) console.error(`    - ${error}`);

  return false;
}

if (import.meta.main) {
  try {
    const docsDir = resolve(import.meta.dir, '..', 'docs');
    console.log('Checking docs/ ...');
    process.exit(reportSiteCheck(checkSite(docsDir)) ? 0 : 1);
  } catch (error) {
    console.error(`  [ERROR] docs/ の検査に失敗しました: ${String(error)}`);
    process.exit(1);
  }
}
