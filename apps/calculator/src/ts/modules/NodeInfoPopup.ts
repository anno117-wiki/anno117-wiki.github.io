import type { I18nManager } from '@anno/shared';
import { ASSETS_ICONS_PATH } from '../constants';
import { formatBuildingCount, attachCostTooltip, toTitleCase } from './Utils';
import type { NodeData } from './GraphTypes';
import { SettingsManager } from './SettingsManager';
import { NodeBonus } from './modifier/NodeBonus';

export class NodeInfoPopup {
    private activeCloseMenu: (() => void) | null = null;

    show(event: MouseEvent, nodeData: NodeData | undefined, i18n: I18nManager): void {
        if (event.button !== 0) return;

        // 既存ポップアップを先に閉じる（stopPropagation前に実行し孤立を防ぐ）
        this.close();

        if (!nodeData) return;

        event.preventDefault();
        event.stopPropagation();

        const { buildingCost, maintenanceCost, buildings, good, productivity, prodNode } = nodeData;

        const infoContainer = document.createElement('div');
        infoContainer.classList.add('metadata-container');
        infoContainer.style.position = 'absolute';
        infoContainer.style.left = `${event.pageX}px`;
        infoContainer.style.top = `${event.pageY}px`;
        infoContainer.tabIndex = -1;
        infoContainer.style.zIndex = '1000';

        const content = document.createElement('div');
        content.className = 'metadata-content';

        const header = document.createElement('div');
        header.className = 'metadata-header';
        const iconEl = document.createElement('img');
        iconEl.src = `${ASSETS_ICONS_PATH}${good.icon || good.id}.png`;
        iconEl.alt = good.displayName;
        iconEl.className = 'metadata-icon';
        iconEl.onerror = () => { iconEl.style.display = 'none'; };
        const h4 = document.createElement('h4');
        h4.textContent = good.displayName || good.id;
        header.appendChild(iconEl);
        header.appendChild(h4);
        content.appendChild(header);

        const countInfo = document.createElement('div');
        countInfo.className = 'metadata-row';

        if (productivity) {
            const productivityInfo = document.createElement('div');
            productivityInfo.className = 'metadata-row';
            productivityInfo.innerHTML = `<strong>${i18n.t('ui.productivity')}:</strong> ${(productivity * 100).toFixed(0)}%`;
            content.appendChild(productivityInfo);
        }

        countInfo.innerHTML = `<strong>${i18n.t('ui.required')}:</strong> ${formatBuildingCount(buildings || 0, i18n.t('ui.buildingUnit'))}`;
        content.appendChild(countInfo);

        const buildingCostEl = this.renderCostList('ui.constructionCost', buildingCost, i18n);
        if (buildingCostEl) content.appendChild(buildingCostEl);

        const maintenanceCostEl = this.renderCostList('ui.maintenance', maintenanceCost, i18n);
        if (maintenanceCostEl) content.appendChild(maintenanceCostEl);

        content.appendChild(this.renderBonusSection(prodNode, i18n, () => this.close()));

        infoContainer.appendChild(content);
        document.body.appendChild(infoContainer);

        let closed = false;
        const closeMenu = () => {
            if (closed) return;
            closed = true;
            if (this.activeCloseMenu === closeMenu) this.activeCloseMenu = null;
            infoContainer.remove();
            document.removeEventListener('mousedown', outsideClickListener);
        };

        this.activeCloseMenu = closeMenu;

        const outsideClickListener = (e: MouseEvent) => {
            if (!infoContainer.contains(e.target as Node)) {
                closeMenu();
            }
        };

        // フォーカスと outsideClickListener 登録を 1 つの setTimeout でまとめる
        // 10ms: DOM レンダリング完了待ち + 現在の mousedown イベント伝播を外す
        setTimeout(() => {
            infoContainer.focus();
            document.addEventListener('mousedown', outsideClickListener);
        }, 10);

        infoContainer.addEventListener('focusout', (e: FocusEvent) => {
            // relatedTarget が null（alt-tab・モバイルキーボード非表示）の場合は閉じない
            if (!e.relatedTarget || infoContainer.contains(e.relatedTarget as Node)) return;
            closeMenu();
        });

        infoContainer.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    public close(): void {
        this.activeCloseMenu?.();
    }

    /** このノードの補正を選ぶ欄。穀物庫（対象の農場など）と、生産性の手入力。変えたら計算に反映して、ポップアップを閉じる */
    private renderBonusSection(good: NodeData['prodNode'], i18n: I18nManager, onChanged: () => void): HTMLElement {
        const settings = SettingsManager.getInstance();
        const guid = String(good.guid);
        const section = document.createElement('div');
        section.className = 'metadata-section metadata-bonus';
        const title = document.createElement('h5');
        title.textContent = i18n.t('ui.nodeBonus');
        section.appendChild(title);

        if (NodeBonus.isGranaryTarget(good)) {
            const row = document.createElement('label');
            row.className = 'metadata-bonus-row';
            const label = document.createElement('span');
            label.textContent = i18n.t('ui.nodeBonusGranary');
            const select = document.createElement('select');
            select.className = 'metadata-bonus-input';
            const current = Number(settings.getSettingRaw(NodeBonus.granaryKey(guid))) || 0;
            for (const lv of NodeBonus.granaryLevels) {
                const option = document.createElement('option');
                option.value = String(lv.level);
                option.textContent = i18n.t(lv.labelKey);
                option.selected = lv.level === current;
                select.appendChild(option);
            }
            select.addEventListener('change', () => {
                settings.setSettingValue(NodeBonus.granaryKey(guid), Number(select.value));
                onChanged();
            });
            row.append(label, select);
            section.appendChild(row);
        }

        const manualRow = document.createElement('label');
        manualRow.className = 'metadata-bonus-row';
        const manualLabel = document.createElement('span');
        manualLabel.textContent = i18n.t('ui.nodeBonusManual');
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        input.inputMode = 'numeric';
        input.className = 'metadata-bonus-input';
        input.placeholder = '0';
        const saved = Number(settings.getSettingRaw(NodeBonus.manualKey(guid)));
        if (Number.isFinite(saved) && saved !== 0) input.value = String(saved);
        // 入力中は反映せず、確定（Enter・フォーカスを外す）したときに反映する
        input.addEventListener('change', () => {
            const parsed = parseFloat(input.value);
            const value = Number.isFinite(parsed) ? NodeBonus.clampManual(parsed) : 0;
            settings.setSettingValue(NodeBonus.manualKey(guid), value);
            onChanged();
        });
        manualRow.append(manualLabel, input);
        section.appendChild(manualRow);
        return section;
    }

    private renderCostList(titleKey: string, costs: Record<string, number> | undefined, i18n: I18nManager): HTMLElement | null {
        if (!costs || Object.keys(costs).length === 0) return null;
        const validCosts = Object.entries(costs).filter(([, amount]) => amount > 0);
        if (validCosts.length === 0) return null;

        const container = document.createElement('div');
        container.className = 'metadata-section';
        container.innerHTML = `<h5>${i18n.t(titleKey)}</h5>`;

        const list = document.createElement('div');
        list.className = 'cost-list';

        validCosts.forEach(([resource, amount]) => {
            const item = document.createElement('div');
            item.className = 'cost-resource';
            const translatedName = i18n.t(`goods.${resource}`);
            const label = translatedName !== resource ? translatedName : toTitleCase(resource);
            item.innerHTML = `<img src="${ASSETS_ICONS_PATH}${resource}.png" alt="${label}" class="cost-icon-small" onerror="this.style.display='none';"/><span>${amount}</span>`;
            attachCostTooltip(item, label);
            list.appendChild(item);
        });
        container.appendChild(list);
        return container;
    }
}
