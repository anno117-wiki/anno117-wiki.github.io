import { App } from "./modules/App";
import { registerAqueductModifier } from "./modules/modifier/Aqueduct";
import { registerItemModifier } from "./modules/modifier/Item";
import { initVueComponents } from "./vue-app";
import { PanelResizer } from "./modules/PanelResizer";

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
});