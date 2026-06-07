import { App } from "./modules/App";
import { registerAqueductModifier } from "./modules/modifier/Aqueduct";
import { registerItemModifier } from "./modules/modifier/Item";
import { initVueComponents } from "./vue-app";

document.addEventListener("DOMContentLoaded", () => {
    registerAqueductModifier();
    registerItemModifier();
    const app = App.getInstance();
    app.initialize();

    // Vueコンポーネントを初期化
    initVueComponents();
});