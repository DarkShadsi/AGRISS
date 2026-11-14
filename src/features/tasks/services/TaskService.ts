import { db } from '../../../core/database/client';
import { CatalogRepository, type CatalogCrop, type FertilizationStage } from '../../crops/data/CatalogRepository';
import { CropRepository, cropName, type CropWithCatalog } from '../../crops/data/CropRepository';
import { TaskRepository, type NewTask, type Task } from '../data/TaskRepository';
import { naturalCompare } from '../../../shared/utils/naturalCompare';
import { addDays, diffInDays, formatLongDate, parseDate, toDateString, todayString, } from '../../../shared/utils/dates';

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

export type TaskCategory = 'harvest' | 'fertilize' | 'custom';

export type TaskView = {
    id: number;
    label: string;           // "Harvest block 3"
    title: string;
    category: TaskCategory;
    source: 'auto' | 'manual';
    block: string | null;
    scheduledDate: string;
    status: 'pending' | 'completed';
    completedAt: number | null;
    subtitle: string | null; // "Cucumber, day 35"
    isToday: boolean;
    isOverdue: boolean;
    daysLate: number;
    canComplete: boolean;    // due today or overdue
};

export type TaskSection = { key: string; title: string; tasks: TaskView[] };
export type TaskInput = { title: string; block: string | null; scheduledDate: string };
export type TaskErrors = Partial<Record<'title' | 'scheduledDate', string>>;
export type TaskUndo =
    | { kind: 'complete'; id: number }
    | { kind: 'postpone'; id: number; previousDate: string }
    | { kind: 'delete'; task: Task };

const CATEGORY_ORDER: Record<TaskCategory, number> = { harvest: 0, fertilize: 1, custom: 2 };
const PAST_TENSE: Record<string, string> = { harvest: 'Harvested', fertilize: 'Fertilized' };

type CropLookup = { byId: Map<number, CropWithCatalog>; byBlock: Map<string, CropWithCatalog> };

function buildLookup(): CropLookup {
    const items = CropRepository.findActive();
    return {
        byId: new Map(items.map((i) => [i.crop.id, i])),
        byBlock: new Map(items.map((i) => [i.crop.block.trim().toLowerCase(), i])),
    };
}

function toView(task: Task, today: string, lookup: CropLookup): TaskView {
    const crop =
        (task.cropId !== null ? lookup.byId.get(task.cropId) : undefined) ??
        (task.block ? lookup.byBlock.get(task.block.trim().toLowerCase()) : undefined);
    const base =
        task.status === 'completed' && task.source === 'auto' ? PAST_TENSE[task.category] ?? task.title : task.title;
    const pending = task.status === 'pending';
    return {
        id: task.id,
        label: task.block ? `${base} block ${task.block}` : base,
        title: task.title,
        category: task.category,
        source: task.source,
        block: task.block,
        scheduledDate: task.scheduledDate,
        status: task.status,
        completedAt: task.completedAt,
        subtitle: crop ? `${cropName(crop)}, day ${diffInDays(crop.crop.plantingDate, task.scheduledDate)}` : null,
        isToday: task.scheduledDate === today,
        isOverdue: pending && task.scheduledDate < today,
        daysLate: pending ? Math.max(0, diffInDays(task.scheduledDate, today)) : 0,
        canComplete: pending && task.scheduledDate <= today,
    };
}

function compareViews(a: TaskView, b: TaskView): number {
    return (
        a.scheduledDate.localeCompare(b.scheduledDate) ||
        CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
        naturalCompare(a.block ?? '', b.block ?? '') ||
        a.id - b.id
    );
}

function dateTitle(date: string, today: string): string {
    const d = diffInDays(today, date);
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    return formatLongDate(date);
}

function validateTask(input: TaskInput, today: string): TaskErrors {
    const errors: TaskErrors = {};
    if (!input.title.trim()) errors.title = 'Please enter the task.';
    const d = input.scheduledDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || toDateString(parseDate(d)) !== d) {
        errors.scheduledDate = 'Please choose the date.';
    } else if (d < today) {
        errors.scheduledDate = 'The date must be today or later.';
    }
    return errors;
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

    getListSections(category: 'all' | TaskCategory = 'all'): TaskSection[] {
        const today = todayString();
        const lookup = buildLookup();
        const views = TaskRepository.findPending()
            .filter((t) => category === 'all' || t.category === category)
            .map((t) => toView(t, today, lookup))
            .sort(compareViews);

        const sections: TaskSection[] = [];
        const overdue = views.filter((v) => v.isOverdue);
        if (overdue.length > 0) sections.push({ key: 'overdue', title: 'Overdue', tasks: overdue });
        for (const v of views.filter((x) => !x.isOverdue)) {
            const last = sections[sections.length - 1];
            if (last && last.key === v.scheduledDate) last.tasks.push(v);
            else sections.push({ key: v.scheduledDate, title: dateTitle(v.scheduledDate, today), tasks: [v] });
        }
        return sections;
    },

    addTask(input: TaskInput): { ok: true; task: Task } | { ok: false; errors: TaskErrors } {
        const errors = validateTask(input, todayString());
        if (Object.keys(errors).length > 0) return { ok: false, errors };
        const task = TaskRepository.insert({
            cropId: null,
            stageId: null,
            title: input.title.trim(),
            category: 'custom',
            source: 'manual',
            block: input.block?.trim() || null,
            scheduledDate: input.scheduledDate,
            status: 'pending',
        });
        return { ok: true, task };
    },

    updateTask(id: number, input: TaskInput): { ok: true } | { ok: false; errors: TaskErrors } {
        const task = TaskRepository.findById(id);
        if (!task || task.status !== 'pending') {
            return { ok: false, errors: { title: 'This task can no longer be changed.' } };
        }
        const errors = validateTask(input, todayString());
        if (Object.keys(errors).length > 0) return { ok: false, errors };
        TaskRepository.update(id, {
            title: input.title.trim(),
            block: input.block?.trim() || null,
            scheduledDate: input.scheduledDate,
        });
        return { ok: true };
    },

    completeTask(id: number): TaskUndo | null {
        const task = TaskRepository.findById(id);
        if (!task || task.status !== 'pending' || task.scheduledDate > todayString()) return null;
        TaskRepository.update(id, { status: 'completed', completedAt: Date.now() });
        return { kind: 'complete', id };
    },

    postponeTask(id: number): TaskUndo | null {
        const today = todayString();
        const task = TaskRepository.findById(id);
        if (!task || task.status !== 'pending' || task.scheduledDate > today) return null;
        TaskRepository.update(id, { scheduledDate: addDays(today, 1) });
        return { kind: 'postpone', id, previousDate: task.scheduledDate };
    },

    deleteTask(id: number): TaskUndo | null {
        const task = TaskRepository.findById(id);
        if (!task || task.status !== 'pending') return null;
        TaskRepository.delete(id);
        return { kind: 'delete', task };
    },

    undo(u: TaskUndo): void {
        if (u.kind === 'complete') TaskRepository.update(u.id, { status: 'pending', completedAt: null });
        else if (u.kind === 'postpone') TaskRepository.update(u.id, { scheduledDate: u.previousDate });
        else TaskRepository.restore(u.task);
    },
};