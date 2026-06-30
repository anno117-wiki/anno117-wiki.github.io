
function formatDuration(seconds: number | string = 0): string {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const secs = Math.round(safeSeconds % 60);
    return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const URLTools = {
    /**
     * Converts a object of boolean values into a single query URL parameters.
     * If key is true, the keys are merged into a comma separated list under the "key" parameter.
     * 
     */
    toGetParam(values: Record<string, boolean>): string {
        let list: string[] = [];
        for (const [k, v] of Object.entries(values)) {
            if (v) list.push(k);
        }
        return `${list.join('~')}`;
    },
    fromGetParam<T extends Record<string, boolean>>(key: string, paramString: string, defaults: T): T {
        const params = new URLSearchParams(paramString);
        const value = params.get(key);
        if (!value) return defaults;

        const enabled = new Set(value.split('~').map(s => s.trim()));
        const result = { ...defaults };
        for (const key of Object.keys(result)) {
            result[key as keyof T] = enabled.has(key) as T[keyof T];
        }
        return result;
    } 
};

/** 建物件数を整形（末尾ゼロ除去＋単位付与）。例: 0.50→"0.5件", 1.00→"1件" */
export function formatBuildingCount(n: number, unit: string): string {
    const rounded = Number((n || 0).toFixed(2));
    return `${rounded}${unit}`;
}

/** コスト要素にホバーツールチップを付与する共通関数 */
export function attachCostTooltip(item: HTMLElement, label: string): void {
    item.addEventListener('mouseenter', () => {
        const tip = document.createElement('div');
        tip.className = 'cost-tooltip';
        tip.textContent = label;
        document.body.appendChild(tip);
        const rect = item.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();
        tip.style.left = `${rect.left + rect.width / 2 - tipRect.width / 2}px`;
        tip.style.top = `${rect.top - tipRect.height - 4}px`;
    });
    item.addEventListener('mouseleave', () => {
        document.querySelectorAll('.cost-tooltip').forEach(el => el.remove());
    });
}

/** snake_case または kebab-case の文字列を Title Case に変換する */
export function toTitleCase(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export { formatDuration, URLTools };