import { db } from '../../../core/database/client';
import { CatalogRepository, type CatalogCrop, type FertilizationStage } from '../../crops/data/CatalogRepository';
import { CropRepository, type CropWithCatalog } from '../../crops/data/CropRepository';
import { TaskRepository, type NewTask } from '../data/TaskRepository';
import { addDays, todayString } from '../../../shared/utils/dates';

export const FERTILIZE_HORIZON_DAYS = 21;
export const HARVEST_HORIZON_DAYS = 30;
export const MAX_UPCOMING_HARVESTS = 5;
export const OVERDUE_GRACE_DAYS = 2;

type TaskRow = Omit<NewTask, 'id'>;
// Dates are YYYY-MM-DD text, so normal string comparison orders them correctly.
const later = (a: string, b: string) => (a > b ? a : b);
const earlier = (a: string, b: string) => (a < b ? a : b);

function fertilizationDates(plantingDate: string, stage: FertilizationStage, harvestDate: string, until: string): string[] {
    const first = addDays(plantingDate, stage.dayOffset);
    if (!stage.isRecurring || !stage.intervalDays || stage.intervalDays <= 0) return [first];
    const end = stage.repeatUntilHarvest ? earlier(harvestDate, until) : until;
    const dates: string[] = [];
    for (let d = first; d <= end; d = addDays(d, stage.intervalDays)) dates.push(d);
    return dates;
}

function harvestDates(plantingDate: string, catalog: CatalogCrop, until: string): string[] {
    const first = addDays(plantingDate, catalog.daysToMaturity);
    if (catalog.isOneTimeHarvest || !catalog.harvestInterval || catalog.harvestInterval <= 0) {
        return first <= until ? [first] : [];
    }
    const dates: string[] = [];
    for (let d = first; d <= until; d = addDays(d, catalog.harvestInterval)) dates.push(d);
    return dates;
}

function topUpCrop(item: CropWithCatalog, today: string): void {
    const { crop, catalog } = item;
    if (!catalog) return; // crops outside the catalog get no automatic tasks

    const rows: TaskRow[] = [];
    let fertilizeUntil = crop.fertilizeTasksUntil;
    let harvestUntil = crop.harvestTasksUntil;
    const harvestDate = addDays(crop.plantingDate, catalog.daysToMaturity);

    // Fertilization: create tasks from the day after the last created date, up to 21 days ahead.
    const fEnd = addDays(today, FERTILIZE_HORIZON_DAYS);
    const fStart = later(today, crop.fertilizeTasksUntil ? addDays(crop.fertilizeTasksUntil, 1) : today);
    if (fStart <= fEnd) {
        const done = TaskRepository.latestCompletedByStage(crop.id);
        for (const stage of CatalogRepository.getStages(catalog.id)) {
            for (const date of fertilizationDates(crop.plantingDate, stage, harvestDate, fEnd)) {
                if (date < fStart || date > fEnd) continue;
                if (done[stage.id] && date <= done[stage.id]) continue; // already done
                rows.push({
                    cropId: crop.id, stageId: stage.id, title: 'Fertilize', category: 'fertilize',
                    source: 'auto', block: crop.block, scheduledDate: date, status: 'pending',
                });
            }
        }
        fertilizeUntil = fEnd;
    }

    // Harvest: at most 5 pending, none further than 30 days ahead.
    const hEnd = addDays(today, HARVEST_HORIZON_DAYS);
    const hStart = later(today, crop.harvestTasksUntil ? addDays(crop.harvestTasksUntil, 1) : today);
    if (hStart <= hEnd) {
        const lastDone = TaskRepository.latestCompletedHarvest(crop.id);
        const slots = MAX_UPCOMING_HARVESTS - TaskRepository.countPendingAutoHarvests(crop.id);
        const candidates = harvestDates(crop.plantingDate, catalog, hEnd).filter(
            (d) => d >= hStart && d <= hEnd && (!lastDone || d > lastDone)
        );
        const picked = slots > 0 ? candidates.slice(0, slots) : [];
        for (const date of picked) {
            rows.push({
                cropId: crop.id, stageId: null, title: 'Harvest', category: 'harvest',
                source: 'auto', block: crop.block, scheduledDate: date, status: 'pending',
            });
        }
        if (candidates.length > picked.length) {
            if (picked.length > 0) harvestUntil = picked[picked.length - 1]; // continue after the last one created
        } else {
            harvestUntil = hEnd;
        }
    }

    if (rows.length === 0 && fertilizeUntil === crop.fertilizeTasksUntil && harvestUntil === crop.harvestTasksUntil) return;
    db.transaction(() => {
        TaskRepository.insertTasks(rows);
        CropRepository.update(crop.id, { fertilizeTasksUntil: fertilizeUntil, harvestTasksUntil: harvestUntil });
    });
}

export const TaskService = {
    generateForCrop(cropId: number, today = todayString()): void {
        const item = CropRepository.findById(cropId);
        if (item) topUpCrop(item, today);
    },

    regenerateForCrop(cropId: number, today = todayString()): void {
        db.transaction(() => {
            TaskRepository.deletePendingAutoTasks(cropId);
            CropRepository.update(cropId, { fertilizeTasksUntil: null, harvestTasksUntil: null });
        });
        this.generateForCrop(cropId, today);
    },

    removeOverdue(today = todayString()): void {
        TaskRepository.deletePendingBefore(addDays(today, -OVERDUE_GRACE_DAYS));
    },

    runMaintenance(today = todayString()): void {
        this.removeOverdue(today);
        for (const item of CropRepository.findActive()) topUpCrop(item, today);
    },
};