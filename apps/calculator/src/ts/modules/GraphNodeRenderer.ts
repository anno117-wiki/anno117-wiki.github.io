import type { Goods, RecipeListItem } from '@anno/shared';
import { ProductionCalculator, type BuildingsMap } from './ProductionCalculator';
import type { GoodsRepository, I18nManager } from '@anno/shared';
import { SVG_NS, XLINK_NS, ASSETS_ICONS_PATH } from '../constants';
import { formatBuildingCount } from './Utils';
import type { GoodMetadata, NodeData, LabelGeometry } from './GraphTypes';
import type { NodeInfoPopup } from './NodeInfoPopup';

const CENTER_X = 360;
const CENTER_Y = 150;
const NODE_X_SPACING = 180;
const NODE_Y_SPACING = 120;
const NODE_ICON_SIZE = 64;
const NODE_CORNER_ICON_RATIO = 0.56;

export class GraphNodeRenderer {
    private svgElement: SVGSVGElement;
    private i18n: I18nManager;
    private goodsRepository: GoodsRepository;
    private popup: NodeInfoPopup;
    private nodeDataMap: WeakMap<SVGElement, NodeData> = new WeakMap();
    private readonly calculator = ProductionCalculator.getInstance();
    private edgeGroup: SVGGElement | null = null;
    private buildingUnit = '';

    constructor(svgElement: SVGSVGElement, i18n: I18nManager, goodsRepository: GoodsRepository, popup: NodeInfoPopup) {
        this.svgElement = svgElement;
        this.i18n = i18n;
        this.goodsRepository = goodsRepository;
        this.popup = popup;
    }

    renderGraph(productionData: Goods, allBuildings: BuildingsMap): void {
        this.edgeGroup = null;
        this.buildingUnit = this.i18n.t('ui.buildingUnit');
        const maxDepth = this.calculateMaxDepth(productionData);
        this.renderRecursiveGraph(productionData, CENTER_X, CENTER_Y, 0, allBuildings, null, null, maxDepth);
    }

    private renderRecursiveGraph(
        prodData: Goods,
        x: number,
        y: number,
        depth: number,
        allBuildings: BuildingsMap,
        parentX: number | null,
        parentY: number | null,
        maxDepth: number
    ): void {
        if (!prodData || depth > 5) return;

        const good = this.findGood(prodData.id, prodData);
        const hasFuel = prodData.needs_fuel === true;
        const buildingCount = allBuildings[prodData.id];
        const buildings = typeof buildingCount === 'number' ? buildingCount : 0;
        const buildingType = prodData.type || '';

        // 横配置（RL）: 常にright（テキストはノードの左側に配置）
        const textAlign: 'left' | 'right' = 'right';

        const inputs = Array.isArray(prodData.input) ? prodData.input : [];
        const isLeaf = inputs.length === 0 || inputs.every((input) => input.start_of_chain);

        this.addNode({
            x,
            y,
            good,
            buildings,
            textAlign,
            hasFuel,
            buildingType,
            prodNode: prodData,
            depth,
            maxDepth,
            isLeaf,
            startOfChain: prodData.start_of_chain === true,
            buildingCost: prodData.building_cost,
            maintenanceCost: prodData.maintanance_cost, // 公式データJSONキーのスペルミス（maintanance）のため変更不可
            productivity: this.calculateProductivity(prodData)
        });

        if (typeof parentX === 'number' && typeof parentY === 'number') {
            this.drawLink(parentX - 32, parentY, x + 32, y, depth === 0);
        }

        if (!inputs.length) return;
        const nextX = x - NODE_X_SPACING;

        const visibleInputs = hasFuel ? inputs.filter((inp) => inp.id !== 'charcoal') : inputs;

        const inputHeights = visibleInputs.map((input) => {
            if (Array.isArray(input.input)) return this.calculateTreeWidth(input);
            return 1;
        });
        const totalHeight = inputHeights.reduce((sum, height) => sum + height, 0);

        let currentOffset = y - (totalHeight * NODE_Y_SPACING) / 2;

        visibleInputs.forEach((input, index) => {
            if (!input.id) return;
            const heightUnits = inputHeights[index] ?? 1;
            const inputY = currentOffset + (heightUnits * NODE_Y_SPACING) / 2;
            currentOffset += heightUnits * NODE_Y_SPACING;

            if (Array.isArray(input.input)) {
                this.renderRecursiveGraph(input, nextX, inputY, depth + 1, allBuildings, x, y, maxDepth);
                return;
            }

            if (input.start_of_chain) {
                const inputGood = this.findGood(input.id, input);
                const inputBuildings = (allBuildings[input.id] as number) || 0;

                this.addNode({
                    x: nextX,
                    y: inputY,
                    good: inputGood,
                    buildings: inputBuildings,
                    textAlign: 'right',
                    hasFuel: false,
                    buildingType: input.type || '',
                    prodNode: input,
                    depth: depth + 1,
                    maxDepth,
                    isLeaf: true,
                    startOfChain: true,
                    buildingCost: input.building_cost,
                    maintenanceCost: input.maintanance_cost, // 公式データJSONキーのスペルミス（maintanance）のため変更不可
                    productivity: this.calculateProductivity(input)
                });
                this.drawLink(x - 32, y, nextX + 32, inputY, false);
            }
        });
    }

    private addNode(nodeData: NodeData): void {
        const { x, y, good, buildings, textAlign, hasFuel, prodNode, depth, maxDepth, isLeaf, startOfChain } = nodeData;
        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('class', 'node');

        const rect = document.createElementNS(SVG_NS, 'rect');
        const size = NODE_ICON_SIZE;
        rect.setAttribute('x', String(x - size / 2));
        rect.setAttribute('y', String(y - size / 2));
        rect.setAttribute('width', String(size));
        rect.setAttribute('height', String(size));
        rect.setAttribute('rx', '12');
        rect.setAttribute('ry', '12');
        rect.setAttribute('class', 'graph-node');
        group.appendChild(rect);

        const img = document.createElementNS(SVG_NS, 'image');
        img.setAttributeNS(XLINK_NS, 'href', `${ASSETS_ICONS_PATH}${good.icon || good.id}.png`);
        img.setAttribute('x', String(x - size / 2));
        img.setAttribute('y', String(y - size / 2));
        img.setAttribute('width', String(size));
        img.setAttribute('height', String(size));
        img.dataset.goodId = good.id;

        this.nodeDataMap.set(img, nodeData);
        img.addEventListener('mousedown', (e) => this.popup.show(e, this.nodeDataMap.get(img), this.i18n));
        group.appendChild(img);

        if (hasFuel) {
            this.addCornerImage(group, x, y, size, `${ASSETS_ICONS_PATH}charcoal.png`);
        } else {
            for (const icon of this.calculator.getActiveVisualModifiersForNode(prodNode)) {
                this.addCornerImage(group, x, y, size, `${ASSETS_ICONS_PATH}${icon}`, true);
            }
        }

        const { labelX, labelAnchor, labelY, buildingsY } = this.resolveLabelGeometry({
            x,
            y,
            textAlign,
            label: good.displayName || good.id,
            buildings: buildings.toFixed(2),
            depth,
            maxDepth,
            isLeaf,
            startOfChain
        });

        const labelText = document.createElementNS(SVG_NS, 'text');
        labelText.setAttribute('x', String(labelX));
        labelText.setAttribute('y', String(labelY));
        labelText.setAttribute('text-anchor', labelAnchor);
        labelText.setAttribute('class', 'graph-text');
        labelText.setAttribute('data-role', 'label');
        labelText.setAttribute('data-good-id', good.id || '');
        labelText.textContent = good.displayName || good.id || 'good';
        group.appendChild(labelText);

        const buildingText = document.createElementNS(SVG_NS, 'text');
        buildingText.setAttribute('x', String(labelX));
        buildingText.setAttribute('y', String(buildingsY));
        buildingText.setAttribute('text-anchor', labelAnchor);
        buildingText.setAttribute('class', 'graph-subtext');
        buildingText.setAttribute('data-role', 'buildings');
        buildingText.setAttribute('data-good-id', good.id || '');
        buildingText.textContent = formatBuildingCount(buildings, this.buildingUnit);
        group.appendChild(buildingText);

        this.svgElement.appendChild(group);
    }

    private drawLink(x1: number, y1: number, x2: number, y2: number, primary: boolean): void {
        if (!this.edgeGroup) {
            this.edgeGroup = document.createElementNS(SVG_NS, 'g') as SVGGElement;
            this.edgeGroup.setAttribute('class', 'edges');
            this.svgElement.insertBefore(this.edgeGroup, this.svgElement.firstChild);
        }

        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.setAttribute('class', primary ? 'graph-link' : 'graph-link-secondary');
        this.edgeGroup.appendChild(line);
    }

    private resolveLabelGeometry(params: {
        x: number;
        y: number;
        textAlign: 'left' | 'right';
        label: string;
        buildings: string;
        depth: number;
        maxDepth: number;
        isLeaf: boolean;
        startOfChain: boolean;
    }): LabelGeometry {
        const { x, y } = params;

        return {
            labelX: x,
            labelY: y - 52,
            buildingsY: y - 37,
            labelAnchor: 'middle'
        };
    }

    private addCornerImage(group: SVGGElement, x: number, y: number, size: number, href: string, filled: boolean = false): void {
        const icon = document.createElementNS(SVG_NS, 'image');
        const iconSize = Math.round(size * NODE_CORNER_ICON_RATIO);
        const cornerX = x + size / 2 - iconSize + 6;
        const cornerY = y + size / 2 - iconSize + 6;
        icon.setAttributeNS(XLINK_NS, 'href', href);
        icon.setAttribute('x', String(cornerX));
        icon.setAttribute('y', String(cornerY));
        icon.setAttribute('width', String(iconSize));
        icon.setAttribute('height', String(iconSize));

        if (filled) {
            const bg = document.createElementNS(SVG_NS, 'rect');
            bg.setAttribute('x', String(cornerX));
            bg.setAttribute('y', String(cornerY));
            bg.setAttribute('width', String(iconSize));
            bg.setAttribute('height', String(iconSize));
            bg.setAttribute('rx', '5');
            bg.setAttribute('ry', '5');
            bg.setAttribute('fill', '#5f032e');
            group.appendChild(bg);
        }
        group.appendChild(icon);
    }

    private calculateProductivity(node: Goods): number {
        return this.calculator.getProductivity(node);
    }

    private calculateTreeWidth(prodData: Goods): number {
        if (!prodData || !Array.isArray(prodData.input) || !prodData.input.length) {
            return 1;
        }
        const effectiveInputs = prodData.needs_fuel
            ? prodData.input.filter((inp) => inp.id !== 'charcoal')
            : prodData.input;
        return effectiveInputs.reduce((sum, input) => {
            if (Array.isArray(input.input)) {
                return sum + this.calculateTreeWidth(input);
            }
            return sum + 1;
        }, 0);
    }

    private calculateMaxDepth(prodData: Goods, depth: number = 0): number {
        if (!prodData || !Array.isArray(prodData.input) || !prodData.input.length) {
            return depth;
        }
        return prodData.input.reduce((max, input) => {
            if (Array.isArray(input.input)) {
                return Math.max(max, this.calculateMaxDepth(input, depth + 1));
            }
            return Math.max(max, depth + 1);
        }, depth);
    }

    private findGood(id: string, node?: Goods): GoodMetadata {
        const goods = this.goodsRepository.getGoodsList();
        const found = goods.find((good: RecipeListItem) => good.id === id);
        if (found) {
            return {
                id: found.id,
                displayName: found.displayName,
                icon: found.icon
            };
        }

        const translatedName = this.i18n.t(`goods.${id}`);
        const fallbackName = node?.name || id;

        if (translatedName !== id && translatedName !== fallbackName) {
            return { id, displayName: translatedName, icon: id };
        }

        return { id, displayName: fallbackName, icon: id };
    }
}
