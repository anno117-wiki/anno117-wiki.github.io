import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, relative, extname, join } from 'path';
import { chromium, devices, type Browser } from '@playwright/test';

// スマホでの表示を確かめる（横にはみ出す表・ページ全体の横ずれ）。
// build:site で作った docs/ を小さな静的サーバーで配信し、スマホの画面サイズで全ページを開いて測る。
//
// 使い方:
//   bun run check:mobile                         … 全ページを iPhone 13 で調べる
//   bun run check:mobile -- --page /wiki/patrons … URL にこの文字を含むページだけ
//   bun run check:mobile -- --device "Pixel 7"   … Playwright の端末名を指定
//   bun run check:mobile -- --threshold 8        … 何pxを超えたら「はみ出し」とするか（既定 4）
//   bun run check:mobile -- --screenshots <dir>  … はみ出した表のスクリーンショットを保存する
//   bun run check:mobile -- --all                … はみ出していない表も含め、全ての表の幅を表示する
// はみ出しが1つでもあれば終了コード 1。

const ROOT = resolve(import.meta.dir, '..');
const DOCS_DIR = resolve(ROOT, 'docs');
const SKIP_DIRS = new Set(['assets', 'icons', 'images', 'diagrams']);
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
// クラウド環境などで、@playwright/test の版に合うブラウザが無いときに使う
const FALLBACK_CHROMIUM = '/opt/pw-browsers/chromium';

interface Options {
  device: string;
  threshold: number;
  page: string | null;
  screenshots: string | null;
  all: boolean;
}

interface TableResult {
  page: string;
  index: number;
  heading: string;
  columns: string;
  rows: number;
  width: number;
  visible: number;
  overflow: number;
}

interface PageResult {
  page: string;
  pageOverflow: number;
  tables: TableResult[];
  error?: string;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { device: 'iPhone 13', threshold: 4, page: null, screenshots: null, all: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = (): string => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${arg} の後に値がありません`);

      return value;
    };
    if (arg === '--device') options.device = next();
    else if (arg === '--threshold') options.threshold = Number(next());
    else if (arg === '--page') options.page = next();
    else if (arg === '--screenshots') options.screenshots = resolve(next());
    else if (arg === '--all') options.all = true;
    else throw new Error(`知らないオプションです: ${arg}`);
  }
  if (!Number.isFinite(options.threshold) || options.threshold < 0) throw new Error('--threshold は0以上の数にしてください');
  if (!devices[options.device]) throw new Error(`Playwright に無い端末名です: ${options.device}`);

  return options;
}

// docs/ の HTML ページを URL の形で集める（404 と画像などのフォルダは除く）
function listPages(dir: string, pages: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) listPages(full, pages);
    } else if (entry.name.endsWith('.html') && entry.name !== '404.html') {
      pages.push('/' + relative(DOCS_DIR, full).replace(/\\/g, '/'));
    }
  }

  return pages.sort();
}

// GitHub Pages と同じく、ディレクトリは index.html、拡張子なしは .html を補って返す
function resolveFile(urlPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  let file = join(DOCS_DIR, decoded);
  if (!file.startsWith(DOCS_DIR)) return null; // docs/ の外は返さない
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;

  return existsSync(file) && statSync(file).isFile() ? file : null;
}

function startServer() {
  return Bun.serve({
    port: 0,
    fetch(request) {
      const file = resolveFile(new URL(request.url).pathname);
      if (!file) return new Response('Not Found', { status: 404 });

      return new Response(readFileSync(file), {
        headers: { 'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' },
      });
    },
  });
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (error) {
    if (!existsSync(FALLBACK_CHROMIUM)) throw error;
    console.warn(`  [WARN] 既定のブラウザを起動できないため ${FALLBACK_CHROMIUM} を使います`);

    return chromium.launch({ executablePath: FALLBACK_CHROMIUM });
  }
}

// ページ内で、本文の表ごとの幅と、ページ全体の横ずれを測る
async function measurePage(browser: Browser, baseUrl: string, path: string, options: Options): Promise<PageResult> {
  const context = await browser.newContext({ ...devices[options.device], deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    await page.goto(baseUrl + path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500); // Vue の描画と Layout.vue の後処理を待つ

    const measured = await page.evaluate(() => {
      const findHeading = (table: Element): string => {
        let node: Element | null = table;
        while (node && !node.classList.contains('vp-doc')) {
          let sibling = node.previousElementSibling;
          while (sibling) {
            if (/^H[1-4]$/.test(sibling.tagName)) return (sibling.textContent ?? '').replace(/[#​]/g, '').trim();
            if (sibling.tagName === 'P' && sibling.querySelector('strong') && (sibling.textContent ?? '').length < 30) {
              return (sibling.textContent ?? '').trim();
            }
            sibling = sibling.previousElementSibling;
          }
          node = node.parentElement;
        }

        return '';
      };

      const tables = [...document.querySelectorAll<HTMLTableElement>('.vp-doc table')].map((table, index) => {
        const box = table.getBoundingClientRect();
        // 表は display:block で横スクロールする。見えている幅と中身の幅の差が、はみ出し
        const visible = Math.round(table.clientWidth);
        const width = Math.round(table.scrollWidth);
        const shown = box.width > 0 && box.height > 0;

        return {
          index,
          heading: findHeading(table),
          columns: [...table.querySelectorAll('thead th')].map((th) => (th.textContent ?? '').trim()).join('|'),
          rows: table.querySelectorAll('tbody tr').length,
          width,
          visible,
          overflow: shown ? width - visible : 0,
          shown,
        };
      });

      return {
        pageOverflow: Math.round(document.documentElement.scrollWidth - window.innerWidth),
        tables: tables.filter((t) => t.shown),
      };
    });

    if (options.screenshots) {
      for (const table of measured.tables.filter((t) => t.overflow > options.threshold)) {
        const name = `${path.replace(/^\//, '').replace(/[/.]/g, '_')}-table${table.index}.png`;
        await page.locator('.vp-doc table').nth(table.index).scrollIntoViewIfNeeded();
        await page.screenshot({ path: resolve(options.screenshots, name) });
      }
    }

    return {
      page: path,
      pageOverflow: measured.pageOverflow,
      tables: measured.tables.map(({ shown: _shown, ...t }) => ({ page: path, ...t })),
    };
  } catch (error) {
    return { page: path, pageOverflow: 0, tables: [], error: String(error) };
  } finally {
    await context.close();
  }
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(resolve(DOCS_DIR, 'index.html'))) {
    console.error('  [ERROR] docs/ にサイトがありません。先に bun run build:site を実行してください');

    return 1;
  }
  if (options.screenshots) mkdirSync(options.screenshots, { recursive: true });

  const pages = listPages(DOCS_DIR).filter((p) => !options.page || p.includes(options.page));
  if (pages.length === 0) {
    console.error(`  [ERROR] 対象のページがありません（--page ${options.page}）`);

    return 1;
  }

  console.log(`Checking mobile layout (${options.device}, ${pages.length} pages, threshold ${options.threshold}px) ...`);
  const server = startServer();
  const browser = await launchBrowser();
  const results: PageResult[] = [];
  try {
    for (const path of pages) results.push(await measurePage(browser, `http://localhost:${server.port}`, path, options));
  } finally {
    await browser.close();
    server.stop(true);
  }

  const failedPages = results.filter((r) => r.error);
  const shiftedPages = results.filter((r) => r.pageOverflow > options.threshold);
  const allTables = results.flatMap((r) => r.tables);
  const overflowing = allTables.filter((t) => t.overflow > options.threshold).sort((a, b) => b.overflow - a.overflow);

  for (const r of failedPages) console.error(`  [ERROR] ${r.page} を開けませんでした: ${r.error}`);
  for (const r of shiftedPages) console.error(`  [NG] ページ全体が横に ${r.pageOverflow}px ずれています: ${r.page}`);

  const listed = options.all ? [...allTables].sort((a, b) => b.overflow - a.overflow) : overflowing;
  for (const t of listed) {
    const mark = t.overflow > options.threshold ? '[NG]' : '    ';
    console.log(
      `  ${mark} ${String(t.overflow).padStart(5)}px  ${t.page}  表${t.index}「${t.heading || '見出しなし'}」` +
        `  ${t.rows}行  列: ${t.columns.slice(0, 60)}`
    );
  }

  const ok = failedPages.length === 0 && shiftedPages.length === 0 && overflowing.length === 0;
  const summary = `ページ ${results.length}件・表 ${allTables.length}件（スマホで表示されているもの）`;
  if (ok) console.log(`  OK: ${summary}に、はみ出しはありません`);
  else console.error(`  [ERROR] ${summary}のうち、はみ出す表 ${overflowing.length}件・横ずれするページ ${shiftedPages.length}件・開けないページ ${failedPages.length}件`);
  if (options.screenshots && overflowing.length > 0) console.log(`  スクリーンショット: ${options.screenshots}`);

  return ok ? 0 : 1;
}

try {
  process.exit(await main());
} catch (error) {
  console.error(`  [ERROR] スマホ表示の確認に失敗しました: ${String(error)}`);
  process.exit(1);
}
