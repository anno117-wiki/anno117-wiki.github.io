import { App } from "./modules/App";
import { registerAqueductModifier } from "./modules/modifier/Aqueduct";
import { registerItemModifier } from "./modules/modifier/Item";
import { initVueComponents, initGoodsList } from "./vue-app";

// Vue化フラグ（段階的移行用）
const USE_VUE_GOODS_LIST = true;

document.addEventListener("DOMContentLoaded", async () => {
    registerAqueductModifier();
    registerItemModifier();
    const app = App.getInstance();
    await app.initialize();

    // Vueコンポーネントを初期化
    initVueComponents();

    // GoodsListをVueコンポーネント化（オプション）
    if (USE_VUE_GOODS_LIST) {
        // 商品リストの読み込みを待つ
        setTimeout(() => {
            const container = app.getSelectionContainer();
            const goods = app.getFilteredGoods();

            if (container && goods.length > 0) {
                initGoodsList(
                    container,
                    goods,
                    (good) => app.selectGood(good)
                );
                console.log('[Vue] GoodsList initialized with', goods.length, 'items');
            }
        }, 500); // 商品データの読み込みを待つ
    }
});