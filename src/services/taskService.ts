import { asc, desc, eq, lte, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { activeTasks, plantingCycles, cropsCatalog } from '@/db/schema';

const base = () =>
    db
        .select({
            id: activeTasks.id,
            taskType: activeTasks.taskType,
            scheduledDate: activeTasks.scheduledDate,
            completedDate: activeTasks.completedDate,
            block: plantingCycles.block,
            crop: cropsCatalog.name,
            plantingDate: plantingCycles.plantingDate,
        })
        .from(activeTasks)
        .innerJoin(plantingCycles, eq(activeTasks.cycleId, plantingCycles.id))
        .innerJoin(cropsCatalog, eq(plantingCycles.cropId, cropsCatalog.id));

// Overdue + next 30 days, earliest first
export function getPendingTasks() {
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    return base()
        .where(and(eq(activeTasks.status, 'pending'), lte(activeTasks.scheduledDate, limit)))
        .orderBy(asc(activeTasks.scheduledDate))
        .all();
}

export function getActivityLog() {
    return base()
        .where(eq(activeTasks.status, 'done'))
        .orderBy(desc(activeTasks.completedDate))
        .limit(100)
        .all();
}

export function completeTask(id: string) {
    db.update(activeTasks)
        .set({ status: 'done', completedDate: new Date() })
        .where(eq(activeTasks.id, id))
        .run();
}