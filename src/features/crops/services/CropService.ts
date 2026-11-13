import { db } from '../../../core/database/client';
import { CatalogRepository, type CatalogCrop } from '../data/CatalogRepository';
import { CropRepository, cropName, type Crop, type CropWithCatalog } from '../data/CropRepository';
import { TaskRepository } from '../../tasks/data/TaskRepository';
import { TaskService } from '../../tasks/services/TaskService';
import { addDays, diffInDays, parseDate, toDateString, todayString } from '../../../shared/utils/dates';
import { UNDO_DURATION_MS } from '../../../shared/theme';

export type CropInput = {
    name: string;
    block: string;
    quantity: string | number;
    unit?: string;
    plantingDate: string; // YYYY-MM-DD
};
export type CropErrors = Partial<Record<'name' | 'block' | 'quantity' | 'plantingDate', string>>;

export type CropView = {
    id: number;
    name: string;
    block: string;
    quantity: number;
    unit: string;
    plantingDate: string;
    inCatalog: boolean;
    ageDays: number;
    harvestInDays: number | null;
    fertilizeInDays: number | null;
};

function validate(input: CropInput): { errors: CropErrors; quantity: number } {
    const errors: CropErrors = {};
    if (!input.name.trim()) errors.name = 'Please enter the crop name.';
    if (!input.block.trim()) errors.block = 'Please enter the block.';
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = 'Enter the number of plants (1 or more).';
    const d = input.plantingDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || toDateString(parseDate(d)) !== d) {
        errors.plantingDate = 'Please choose the planting date.';
    }
    return { errors, quantity };
}

function findCatalogMatch(name: string): CatalogCrop | undefined {
    const n = name.trim().toLowerCase();
    return CatalogRepository.findByName(n, 50).find(
        (c) => c.englishName.toLowerCase() === n || c.filipinoName?.toLowerCase() === n
    );
}

function isBlockTaken(block: string, exceptId?: number): boolean {
    const b = block.trim().toLowerCase();
    return CropRepository.findActive().some(
        (i) => i.crop.id !== exceptId && i.crop.block.trim().toLowerCase() === b
    );
}

const blockTakenMessage = (block: string) =>
    `Block ${block.trim()} already has a crop. Each block can hold only one crop.`;

function toView(item: CropWithCatalog, today: string): CropView {
    const { crop, catalog } = item;
    const nextHarvest =
        TaskRepository.nextPendingDate(crop.id, 'harvest') ??
        (catalog ? addDays(crop.plantingDate, catalog.daysToMaturity) : null);
    const nextFertilize = TaskRepository.nextPendingDate(crop.id, 'fertilize');
    return {
        id: crop.id,
        name: cropName(item),
        block: crop.block,
        quantity: crop.quantity,
        unit: crop.unit,
        plantingDate: crop.plantingDate,
        inCatalog: !!catalog,
        ageDays: diffInDays(crop.plantingDate, today),
        harvestInDays: nextHarvest ? diffInDays(today, nextHarvest) : null,
        fertilizeInDays: nextFertilize ? diffInDays(today, nextFertilize) : null,
    };
}

const pendingDeletes = new Map<number, ReturnType<typeof setTimeout>>();

export const CropService = {
    getCrops(): CropView[] {
        const today = todayString();
        return CropRepository.findActive()
            .filter((item) => !pendingDeletes.has(item.crop.id)) // hidden while the Undo message is showing
            .map((item) => toView(item, today));
    },

    suggestCrops(query: string): CatalogCrop[] {
        return query.trim() ? CatalogRepository.findByName(query) : [];
    },

        suggestNextBlock(): string {
            const items = CropRepository.findActive();
            if (items.length === 0) return '1';
            const last = items.reduce((a, b) =>
                b.crop.createdAt > a.crop.createdAt || (b.crop.createdAt === a.crop.createdAt && b.crop.id > a.crop.id) ? b : a
            );
            const m = last.crop.block.trim().match(/^(.*?)(\d+)$/);
            if (!m) return '';
            let n = 1;
            while (isBlockTaken(m[1] + n)) n += 1;
            return m[1] + n;
        },

    addCrop(input: CropInput): { ok: true; crop: Crop } | { ok: false; errors: CropErrors } {
        const { errors, quantity } = validate(input);
        if (!errors.block && isBlockTaken(input.block)) errors.block = blockTakenMessage(input.block);
        if (Object.keys(errors).length > 0) return { ok: false, errors };

        const match = findCatalogMatch(input.name);
        const crop = CropRepository.insert({
            catalogId: match?.id ?? null,
            customName: match ? null : input.name.trim(),
            block: input.block.trim(),
            quantity,
            unit: input.unit?.trim() || match?.unit || 'units',
            plantingDate: input.plantingDate,
            createdAt: Date.now(),
        });
        TaskService.generateForCrop(crop.id);
        return { ok: true, crop };
    },

    updateCrop(id: number, input: CropInput): { ok: true } | { ok: false; errors: CropErrors } {
        const { errors, quantity } = validate(input);
        if (!errors.block && isBlockTaken(input.block, id)) errors.block = blockTakenMessage(input.block);
        if (Object.keys(errors).length > 0) return { ok: false, errors };
        const before = CropRepository.findById(id);
        if (!before) return { ok: false, errors: { name: 'This crop no longer exists.' } };

        const match = findCatalogMatch(input.name);
        const block = input.block.trim();
        CropRepository.update(id, {
            catalogId: match?.id ?? null,
            customName: match ? null : input.name.trim(),
            block,
            quantity,
            unit: input.unit?.trim() || match?.unit || 'units',
            plantingDate: input.plantingDate,
        });

        const scheduleChanged =
            before.crop.plantingDate !== input.plantingDate || (before.crop.catalogId ?? null) !== (match?.id ?? null);
        if (scheduleChanged) TaskService.regenerateForCrop(id);
        else if (before.crop.block !== block) TaskRepository.updatePendingAutoBlock(id, block);
        return { ok: true };
    },

    deleteCrop(id: number): void {
        if (pendingDeletes.has(id)) return;
        pendingDeletes.set(id, setTimeout(() => CropService.commitDelete(id), UNDO_DURATION_MS));
    },

    cancelPendingDelete(id: number): void {
        const timer = pendingDeletes.get(id);
        if (timer) clearTimeout(timer);
        pendingDeletes.delete(id);
    },

    commitDelete(id: number): void {
        CropService.cancelPendingDelete(id);
        db.transaction(() => {
            CropRepository.softDelete(id);
            TaskRepository.deletePendingTasks(id);
        });
    },
};