import { App } from "./modules/App";
import { registerAqueductModifier } from "./modules/modifier/Aqueduct";
import { registerItemModifier } from "./modules/modifier/Item";
import { initVueComponents } from "./vue-app";
import { PanelResizer } from "./modules/PanelResizer";

function initMobileSheets() {
    const overlay = document.getElementById('mobile-sheet-overlay');
    const goodsSheet = document.getElementById('selection-container');
    const modifierSheet = document.getElementById('modifier-container');
    const btnGoods = document.getElementById('mobile-btn-goods');
    const btnModifier = document.getElementById('mobile-btn-modifier');

    function closeSheets() {
        goodsSheet?.classList.remove('sheet-open');
        modifierSheet?.classList.remove('sheet-open');
        overlay?.classList.remove('active');
        btnGoods?.classList.remove('active');
        btnModifier?.classList.remove('active');
    }

    function openSheet(sheet: HTMLElement | null, btn: HTMLElement | null) {
        closeSheets();
        sheet?.classList.add('sheet-open');
        overlay?.classList.add('active');
        btn?.classList.add('active');
    }

    btnGoods?.addEventListener('click', () => openSheet(goodsSheet, btnGoods));
    btnModifier?.addEventListener('click', () => openSheet(modifierSheet, btnModifier));
    overlay?.addEventListener('click', closeSheets);

    // App.ts から呼び出せるよう window に登録
    (window as unknown as { __closeMobileSheets: () => void }).__closeMobileSheets = closeSheets;
}

document.addEventListener("DOMContentLoaded", async () => {
    registerAqueductModifier();
    registerItemModifier();
    const app = App.getInstance();
    await app.initialize();

    // Vueコンポーネントを初期化
    initVueComponents();

    // パネルリサイズ機能を初期化
    const panelResizer = PanelResizer.getInstance();
    panelResizer.restoreSavedWidth();

    // モバイルボトムシートトグルを初期化
    initMobileSheets();
});