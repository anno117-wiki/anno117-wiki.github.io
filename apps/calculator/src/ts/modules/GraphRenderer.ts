import type { Goods } from '@anno/shared';
import { type BuildingsMap } from './ProductionCalculator';
import { GoodsRepository } from '@anno/shared';
import { I18nManager } from '@anno/shared';
import { SVG_NS } from '../constants';
import type { ViewBox } from './GraphTypes';
import { NodeInfoPopup } from './NodeInfoPopup';
import { GraphInteractionHandler } from './GraphInteractionHandler';
import { GraphNodeRenderer } from './GraphNodeRenderer';

/**
 * Renders dependency graphs inside an external SVG template.
 * Singleton — always access via GraphRenderer.getInstance().
 */
export class GraphRenderer {
    private static _instance: GraphRenderer | null = null;

    public static getInstance(): GraphRenderer {
        if (!GraphRenderer._instance) {
            GraphRenderer._instance = new GraphRenderer();
        }
        return GraphRenderer._instance;
    }

    private svgElement: SVGSVGElement | null;
    private viewBoxes: Map<string, ViewBox> = new Map();
    private currentGoodId: string | null = null;
    private i18n: I18nManager;
    private goodsRepository: GoodsRepository;
    private popup: NodeInfoPopup = new NodeInfoPopup();
    private interactionHandler: GraphInteractionHandler | null = null;
    private nodeRenderer: GraphNodeRenderer | null = null;

    private constructor() {
        this.i18n = I18nManager.getInstance();
        this.goodsRepository = GoodsRepository.getInstance();
        this.svgElement = null;
    }

    async attach(container: HTMLElement | null, goodId?: string): Promise<void> {
        if (!container) return;

        if (this.interactionHandler && this.currentGoodId) {
            this.viewBoxes.set(this.currentGoodId, this.interactionHandler.parseViewBox());
        }
        this.interactionHandler?.cancel();

        this.currentGoodId = goodId ?? null;
        const savedViewBox = goodId ? this.viewBoxes.get(goodId) : undefined;
        const viewBoxAttr = savedViewBox
            ? `${savedViewBox.x} ${savedViewBox.y} ${savedViewBox.width} ${savedViewBox.height}`
            : '0 0 400 400';

        const svgElement = document.createElement('svg');
        svgElement.setAttribute('xmlns', SVG_NS);
        svgElement.setAttribute('id', 'dependency-graph');
        svgElement.setAttribute('class', 'dependency-graph');
        svgElement.setAttribute('viewBox', viewBoxAttr);
        container.innerHTML = svgElement.outerHTML;
        this.svgElement = container.querySelector('#dependency-graph') as SVGSVGElement | null;
        if (this.svgElement) {
            this.interactionHandler = new GraphInteractionHandler(this.svgElement, (vb) => {
                if (this.currentGoodId) this.viewBoxes.set(this.currentGoodId, { ...vb });
            });
            this.nodeRenderer = new GraphNodeRenderer(this.svgElement, this.i18n, this.goodsRepository, this.popup);
        } else {
            this.interactionHandler = null;
            this.nodeRenderer = null;
        }
    }

    render(productionData: Goods, allBuildings: BuildingsMap): void {
        if (!this.svgElement || !productionData) return;
        this.clearSvg();
        if (!allBuildings || Object.keys(allBuildings).length === 0) return;

        this.nodeRenderer?.renderGraph(productionData, allBuildings);

        if (!this.currentGoodId || !this.viewBoxes.has(this.currentGoodId)) {
            this.interactionHandler?.fitToView();
        }
    }

    clearSvg(): void {
        this.popup.close();
        if (!this.svgElement) return;
        while (this.svgElement.firstChild) {
            this.svgElement.removeChild(this.svgElement.firstChild);
        }
    }
}
