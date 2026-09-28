import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. CROP CATALOG
export const cropsCatalog = sqliteTable('crops_catalog', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    filipinoName: text('filipino_name'), // NEW
    variety: text('variety'),
    growthCycleDays: integer('growth_cycle_days').notNull(),
});

export const cropTasksTemplate = sqliteTable('crop_tasks_template', {
    id: text('id').primaryKey(),
    cropId: text('crop_id').references(() => cropsCatalog.id, { onDelete: 'cascade' }),
    taskName: text('task_name').notNull(),
    taskType: text('task_type').notNull().default('fertilize'), // NEW: 'fertilize' | 'spray' | 'harvest'
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
    block: text('block'),                                    // NEW: "Block: 1"
    quantity: integer('quantity').notNull().default(0),      // NEW: "Quantity: 200"
    plantingDate: integer('planting_date', { mode: 'timestamp' }).notNull(),
    status: text('status').default('active'),                // 'active' | 'harvested'
});

export const activeTasks = sqliteTable('active_tasks', {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id').references(() => plantingCycles.id, { onDelete: 'cascade' }), // CHANGED: cascade
    templateId: text('template_id').references(() => cropTasksTemplate.id), // null for custom tasks
    taskName: text('task_name').notNull(),                   // NEW: needed for custom tasks (SID_B5)
    taskType: text('task_type').notNull(),                   // NEW: colors/icons in your UI
    notes: text('notes'),                                    // NEW: for the (i) details
    scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
    completedDate: integer('completed_date', { mode: 'timestamp' }), // CHANGED: nullable
    status: text('status').default('pending'),               // 'pending' | 'done'
});

export const financialLogs = sqliteTable('financial_logs', {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id').references(() => plantingCycles.id, { onDelete: 'set null' }), // CHANGED
    type: text('type').notNull(),                            // 'income' or 'expense'
    unitsYield: real('units_yield'),                         // NEW: "Units yield: 10"
    pricePerUnit: real('price_per_unit'),                    // NEW: "Price per unit: ₱50"
    amount: real('amount').notNull(),                        // units × price
    category: text('category'),
    date: integer('date', { mode: 'timestamp' }).notNull(),
});