// ========== WIRES THE UI AND THE DATABASE FOR CROPS ===========

import { db } from '../../../core/database/client';
import { CatalogRepository, type CatalogCrop } from '../data/CatalogRepository';
import { CropRepository, cropName, type Crop, type CropWithCatalog } from '../data/CropRepository';
import { TaskRepository, type Task } from '../../tasks/data/TaskRepository';
import { TaskService } from '../../tasks/services/TaskService';
import { addDays, diffInDays, parseDate, toDateString, todayString } from '../../../shared/utils/dates';

// The input from the user
export type CropInput = {
    name: string;
    block: string;
    quantity: string | number;
    unit?: string;
    plantingDate: string; // YYYY-MM-DD
};

// Feedback for the input validation
export type CropErrors = Partial<Record<'name' | 'block' | 'quantity' | 'plantingDate', string>>;

// Ready to use for UI rendering
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

// A snapshot/undo payload so deleting can be undone
export type DeletedCrop = { cropId: number; tasks: Task[] };

// Validate user inputs
function validate(input: CropInput): { errors: CropErrors; quantity: number } {
    // Validate all fields before writing so invalid form values never reach the repository.
    const errors: CropErrors = {};
    if (!input.name.trim()) errors.name = 'Please enter the crop name.';
    if (!input.block.trim()) errors.block = 'Please enter the block.';
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = 'Enter the number of plants (1 or more).';
    const d = input.plantingDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || toDateString(parseDate(d)) !== d) {
        errors.plantingDate = 'Please choose the planting date.';
    } else if (d > todayString()) {
        errors.plantingDate = 'The planting date cannot be in the future.';
    }
    return { errors, quantity };
}

// Checks if the crop name the user entered matches anything in the catalog
function findCatalogMatch(name: string): CatalogCrop | undefined {
    // Exact English or Filipino matches connect a crop to its maturity and fertilization schedule.
    const n = name.trim().toLowerCase();
    return CatalogRepository.findByName(n, 50).find(
        (c) => c.englishName.toLowerCase() === n || c.filipinoName?.toLowerCase() === n
    );
}

// Check the block's availability
function isBlockTaken(block: string, exceptId?: number): boolean {
    // Compare normalized block names so "1" and " 1 " are treated as the same block.
    const b = block.trim().toLowerCase();
    return CropRepository.findActive().some(
        (i) => i.crop.id !== exceptId && i.crop.block.trim().toLowerCase() === b
    );
}

const blockTakenMessage = (block: string) =>
    `Block ${block.trim()} already has a crop. Each block can hold only one crop.`;

// Helper that transforms retrieved database data into UI ready format
function toView(item: CropWithCatalog, today: string): CropView {
    // Turn database rows into summary values that the cards and popups can display directly.
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

// The business-logic and orchestration object that sits between the UI layer and the data/task layer
export const CropService = {
    getCrops(): CropView[] {
        const today = todayString();
        return CropRepository.findActive()
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
        // Editing catalog or planting data changes the task schedule, while only moving a block updates existing task labels.
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

    deleteCrop(id: number): DeletedCrop {
        // Preserve pending tasks in one transaction so the delete and undo operations stay reversible.
        let removed: Task[] = [];
        db.transaction(() => {
            removed = TaskRepository.takePendingTasks(id);
            CropRepository.softDelete(id);
        });
        return { cropId: id, tasks: removed };
    },

    restoreCrop(deleted: DeletedCrop): void {
        db.transaction(() => {
            CropRepository.restore(deleted.cropId);
            TaskRepository.insertTasks(deleted.tasks.map(({ id, ...rest }) => rest));
        });
    },
};