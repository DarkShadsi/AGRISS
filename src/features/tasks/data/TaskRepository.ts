import { and, eq } from 'drizzle-orm';
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

    deletePendingTasks(cropId: number): void {
        db.delete(tasks)
            .where(and(eq(tasks.cropId, cropId), eq(tasks.status, 'pending')))
            .run();
    },
};