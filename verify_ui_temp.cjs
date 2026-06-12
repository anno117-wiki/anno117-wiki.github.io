const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 日本語に切り替え（setLocale→assets/i18n/locales/ja.json を再fetch）
  const langBtn = await page.$('#language-toggle-btn');
  if (langBtn) {
    const txt = await langBtn.textContent();
    if (txt?.trim() === 'EN') {
      await langBtn.click();
      await page.waitForTimeout(1200);
    }
  }

  // assets側のja.jsonをブラウザ内fetchで確認
  const jaModifiers = await page.evaluate(async () => {
    const resp = await fetch('/i18n/locales/ja.json?' + Date.now());
    const data = await resp.json();
    return { item: data.modifiers?.item, items: data.modifiers?.items, aqueduct: data.modifiers?.aqueduct };
  });
  console.log('=== ja.json fetch確認 ===');
  console.log('modifiers.item:', jaModifiers.item);
  console.log('modifiers.items:', jaModifiers.items);
  console.log('modifiers.aqueduct:', jaModifiers.aqueduct);

  // カテゴリ展開してパン選択
  const catHeaders = await page.$$('.tree-category-header');
  if (catHeaders.length > 0) {
    await catHeaders[0].click();
    await page.waitForTimeout(500);
  }

  const allItems = await page.$$('.tree-item');
  for (const item of allItems) {
    const txt = await item.textContent();
    if (txt && txt.includes('パン')) {
      await item.click();
      break;
    }
  }
  await page.waitForTimeout(2500);

  // modifier見出し確認
  const modSections = await page.$$('.modifier-section');
  console.log('=== modifier見出し確認 ===');
  for (let i = 0; i < modSections.length; i++) {
    const h4 = await modSections[i].$('.modifier-section-header h4');
    if (h4) console.log(`  Section ${i}:`, await h4.textContent());
  }

  // 右パネルをスクロールしてitemセクション表示
  if (modSections.length >= 2) {
    await modSections[modSections.length - 1].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }

  const tmpDir = os.tmpdir();
  await page.screenshot({ path: path.join(tmpDir, 'ss_final_item_heading.png') });
  console.log('Screenshot saved:', path.join(tmpDir, 'ss_final_item_heading.png'));

  await browser.close();
  console.log('Done');
})();
