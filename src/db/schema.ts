import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. CROP CATALOG
export const cropsCatalog = sqliteTable('crops_catalog', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    variety: text('variety'),
    growthCycleDays: integer('growth_cycle_days').notNull(),
});

export const cropTasksTemplate = sqliteTable('crop_tasks_template', {
    id: text('id').primaryKey(),
    cropId: text('crop_id').references(() => cropsCatalog.id),
    taskName: text('task_name').notNull(),
    dayOffset: integer('day_offset').notNull(),
    intervalDays: integer('interval_days'),
    description: text('description'),
});

export const userFields = sqliteTable('user_fields', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    area: text('area'),
});

export const plantingCycles = sqliteTable('planting_cycles', {
    id: text('id').primaryKey(),
    fieldId: text('field_id').references(() => userFields.id),
    cropId: text('crop_id').references(() => cropsCatalog.id),
    plantingDate: integer('planting_date', {mode: 'timestamp'}).notNull(),
    status: text('status').default('active'),
});

export const activeTasks = sqliteTable('active_tasks', {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id').references(() => plantingCycles.id),
    templateId: text('template_id').references(() => cropTasksTemplate.id),
    scheduledDate: integer('scheduled_date', { mode: 'timestamp'}).notNull(),
    completedDate: integer('completed_date', {mode: 'timestamp'}).notNull(),
    status: text('status').default('pending'),
});

export const financialLogs = sqliteTable('financial_logs', {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id').references(() => plantingCycles.id),
    type: text('type').notNull(), // 'income' or 'expense'
    amount: real('amount').notNull(),
    category: text('category'),
    date: integer('date', { mode: 'timestamp' }).notNull(),
});
