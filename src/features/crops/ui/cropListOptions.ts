import type { CropView } from '../services/CropService';

export type SortKey = 'planting' | 'harvest' | 'name' | 'block';
export type TypeFilter = 'all' | 'catalog' | 'custom';
export type CropFilter = { type: TypeFilter; block: string | null };

export const DEFAULT_SORT: SortKey = 'planting';
export const DEFAULT_FILTER: CropFilter = { type: 'all', block: null };

export const SORT_LABELS: Record<SortKey, string> = {
    planting: 'Planting date (oldest first)',
    harvest: 'Harvest date (soonest first)',
    name: 'Name (A to Z)',
    block: 'Block (1, 2, 3...)',
};

export const TYPE_LABELS: Record<TypeFilter, string> = {
    all: 'All crops',
    catalog: 'Catalog crops',
    custom: 'Custom crops',
};

/** Orders "2" before "10", and "A2" before "A10". */
export function naturalCompare(a: string, b: string): number {
    const ax = a.toLowerCase().match(/\d+|\D+/g) ?? [];
    const bx = b.toLowerCase().match(/\d+|\D+/g) ?? [];
    for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
        const x = ax[i], y = bx[i];
        if (x === y) continue;
        if (/^\d+$/.test(x) && /^\d+$/.test(y)) return Number(x) - Number(y);
        return x < y ? -1 : 1;
    }
    return ax.length - bx.length;
}

export function applyView(crops: CropView[], query: string, sort: SortKey, filter: CropFilter): CropView[] {
    const q = query.trim().toLowerCase();
    const list = crops.filter((c) => {
        if (q && !c.name.toLowerCase().includes(q) && !c.block.toLowerCase().includes(q)) return false;
        if (filter.type === 'catalog' && !c.inCatalog) return false;
        if (filter.type === 'custom' && c.inCatalog) return false;
        if (filter.block !== null && c.block !== filter.block) return false;
        return true;
    });
    const by: Record<SortKey, (a: CropView, b: CropView) => number> = {
        planting: (a, b) => a.plantingDate.localeCompare(b.plantingDate) || a.id - b.id,
        harvest: (a, b) => (a.harvestInDays ?? Infinity) - (b.harvestInDays ?? Infinity) || a.id - b.id,
        name: (a, b) => a.name.localeCompare(b.name) || a.id - b.id,
        block: (a, b) => naturalCompare(a.block, b.block) || a.id - b.id,
    };
    return [...list].sort(by[sort]);
}

export function describeView(sort: SortKey, filter: CropFilter): string[] {
    const lines: string[] = [];
    if (sort !== DEFAULT_SORT) lines.push(`Sorted by: ${SORT_LABELS[sort]}`);
    const parts: string[] = [];
    if (filter.type !== 'all') parts.push(TYPE_LABELS[filter.type]);
    if (filter.block !== null) parts.push(`Block ${filter.block}`);
    if (parts.length) lines.push(`Showing: ${parts.join(', ')}`);
    return lines;
}