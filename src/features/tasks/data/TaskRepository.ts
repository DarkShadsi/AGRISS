import { and, count, eq, isNotNull, lt, max, min } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { tasks } from '../../../core/database/schema';

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export const TaskRepository = {
    insertTasks(rows: Omit<NewTask, 'id'>[]): void {
        if (rows.length === 0) return;
        db.insert(tasks).values(rows).run();
    },

    replacePendingAutoTasks(cropId: number, rows: Omit<NewTask, 'id'>[]): void {
        db.transaction((tx) => {
            tx.delete(tasks)
                .where(and(eq(tasks.cropId, cropId), eq(tasks.source, 'auto'), eq(tasks.status, 'pending')))
                .run();
            if (rows.length > 0) tx.insert(tasks).values(rows).run();
        });
    },

    deletePendingAutoTasks(cropId: number): void {
        db.delete(tasks)
            .where(and(eq(tasks.cropId, cropId), eq(tasks.source, 'auto'), eq(tasks.status, 'pending')))
            .run();
    },

    deletePendingTasks(cropId: number): void {
        db.delete(tasks).where(and(eq(tasks.cropId, cropId), eq(tasks.status, 'pending'))).run();
    },

    deletePendingBefore(date: string): void {
        db.delete(tasks).where(and(eq(tasks.status, 'pending'), lt(tasks.scheduledDate, date))).run();
    },

    countPendingAutoHarvests(cropId: number): number {
        const row = db
            .select({ n: count() })
            .from(tasks)
            .where(and(eq(tasks.cropId, cropId), eq(tasks.source, 'auto'), eq(tasks.category, 'harvest'), eq(tasks.status, 'pending')))
            .get();
        return row?.n ?? 0;
    },

    latestCompletedHarvest(cropId: number): string | null {
        const row = db
            .select({ d: max(tasks.scheduledDate) })
            .from(tasks)
            .where(and(eq(tasks.cropId, cropId), eq(tasks.category, 'harvest'), eq(tasks.status, 'completed')))
            .get();
        return row?.d ?? null;
    },

    latestCompletedByStage(cropId: number): Record<number, string> {
        const rows = db
            .select({ stageId: tasks.stageId, d: max(tasks.scheduledDate) })
            .from(tasks)
            .where(and(eq(tasks.cropId, cropId), eq(tasks.category, 'fertilize'), eq(tasks.status, 'completed'), isNotNull(tasks.stageId)))
            .groupBy(tasks.stageId)
            .all();
        const result: Record<number, string> = {};
        for (const r of rows) if (r.stageId !== null && r.d) result[r.stageId] = r.d;
        return result;
    },
    
    nextPendingDate(cropId: number, category: 'harvest' | 'fertilize'): string | null {
        const row = db
            .select({ d: min(tasks.scheduledDate) })
            .from(tasks)
            .where(and(eq(tasks.cropId, cropId), eq(tasks.category, category), eq(tasks.status, 'pending')))
            .get();
        return row?.d ?? null;
    },

    updatePendingAutoBlock(cropId: number, block: string): void {
        db.update(tasks)
            .set({ block })
            .where(and(eq(tasks.cropId, cropId), eq(tasks.source, 'auto'), eq(tasks.status, 'pending')))
            .run();
    },
};