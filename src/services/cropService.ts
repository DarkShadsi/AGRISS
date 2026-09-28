import { randomUUID } from 'expo-crypto';
import { like, or } from 'drizzle-orm';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import {
    cropsCatalog,
    cropTasksTemplate,
    plantingCycles,
    activeTasks,
} from '@/db/schema';

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

// Autosuggest while typing the crop name
export function searchCrops(query: string) {
    const q = query.trim();
    if (!q) return [];
    return db
        .select()
        .from(cropsCatalog)
        .where(or(
            like(cropsCatalog.name, `%${q}%`),
            like(cropsCatalog.filipinoName, `%${q}%`),
        ))
        .limit(8)
        .all();
}

type AddCropInput = {
    cropId: string;
    block: string;
    quantity: number;
    plantingDate: Date;
};

export function addCrop({ cropId, block, quantity, plantingDate }: AddCropInput) {
    const crop = db
        .select()
        .from(cropsCatalog)
        .where(eq(cropsCatalog.id, cropId))
        .get();
    if (!crop) throw new Error(`Crop not found: ${cropId}`);

    const templates = db
        .select()
        .from(cropTasksTemplate)
        .where(eq(cropTasksTemplate.cropId, cropId))
        .all();

    const cycleId = randomUUID();
    const tasks: (typeof activeTasks.$inferInsert)[] = [];

    for (const t of templates) {
        // First occurrence, then repeat every intervalDays until harvest
        let offset = t.dayOffset;
        do {
            tasks.push({
                id: randomUUID(),
                cycleId,
                templateId: t.id,
                taskName: t.taskName,
                taskType: t.taskType,
                scheduledDate: addDays(plantingDate, offset),
                status: 'pending',
            });
            offset += t.intervalDays ?? 0;
        } while (t.intervalDays && offset < crop.growthCycleDays);
    }

    // Harvest task (not in the JSON, so it's generated here)
    tasks.push({
        id: randomUUID(),
        cycleId,
        templateId: null,
        taskName: 'Harvest',
        taskType: 'harvest',
        scheduledDate: addDays(plantingDate, crop.growthCycleDays),
        status: 'pending',
    });

    // Both inserts succeed or neither does
    db.transaction((tx) => {
        tx.insert(plantingCycles)
            .values({ id: cycleId, cropId, block, quantity, plantingDate })
            .run();
        tx.insert(activeTasks).values(tasks).run();
    });

    return cycleId;
}

const dayDiff = (target: Date, from = new Date()) => {
    const a = new Date(target); a.setHours(0, 0, 0, 0);
    const b = new Date(from);   b.setHours(0, 0, 0, 0);
    return Math.round((a.getTime() - b.getTime()) / 86400000);
};

export function getCropCards() {
    const cycles = db
        .select({
            id: plantingCycles.id,
            name: cropsCatalog.name,
            block: plantingCycles.block,
            quantity: plantingCycles.quantity,
            plantingDate: plantingCycles.plantingDate,
        })
        .from(plantingCycles)
        .innerJoin(cropsCatalog, eq(plantingCycles.cropId, cropsCatalog.id))
        .where(eq(plantingCycles.status, 'active'))
        .all();

    if (cycles.length === 0) return [];

    // One query for all pending tasks, earliest first
    const pending = db
        .select()
        .from(activeTasks)
        .where(and(
            inArray(activeTasks.cycleId, cycles.map((c) => c.id)),
            eq(activeTasks.status, 'pending'),
        ))
        .orderBy(asc(activeTasks.scheduledDate))
        .all();

    return cycles.map((c) => {
        const mine = pending.filter((t) => t.cycleId === c.id);
        const harvest = mine.find((t) => t.taskType === 'harvest');
        const fertilize = mine.find((t) => t.taskType === 'fertilize');
        return {
            ...c,
            ageDays: -dayDiff(c.plantingDate),
            harvestIn: harvest ? dayDiff(harvest.scheduledDate) : null,
            fertilizeIn: fertilize ? dayDiff(fertilize.scheduledDate) : null,
        };
    });
}

export function deleteCrop(cycleId: string) {
    // Explicit, so it works even if foreign keys are off
    db.transaction((tx) => {
        tx.delete(activeTasks).where(eq(activeTasks.cycleId, cycleId)).run();
        tx.delete(plantingCycles).where(eq(plantingCycles.id, cycleId)).run();
    });
}