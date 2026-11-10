import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

export const cropsCatalog = sqliteTable('crops_catalog', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    englishName: text('english_name').notNull(),
    filipinoName: text('filipino_name'),
    scientificName: text('scientific_name'),
    daysToMaturity: integer('days_to_maturity').notNull(),
    isOneTimeHarvest: integer('is_one_time_harvest', { mode: 'boolean' }).notNull(),
    harvestInterval: integer('harvest_interval'),
    yieldPerPlant: real('yield_per_plant'),
    unit: text('unit').notNull(),
});

export const cropFertilizationStages = sqliteTable('crop_fertilization_stages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cropCatalogId: integer('crop_catalog_id').notNull().references(() => cropsCatalog.id),
    stageOrder: integer('stage_order').notNull(),
    stageName: text('stage_name').notNull(),
    fertilizer: text('fertilizer'),
    dayOffset: integer('day_offset').notNull(),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull(),
    intervalDays: integer('interval_days'),
    repeatUntilHarvest: integer('repeat_until_harvest', { mode: 'boolean' }).notNull(),
});

export const crops = sqliteTable('crops', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    catalogId: integer('catalog_id').references(() => cropsCatalog.id),
    customName: text('custom_name'),
    block: text('block').notNull(),
    quantity: integer('quantity').notNull(),
    plantingDate: text('planting_date').notNull(),
    createdAt: integer('created_at').notNull(),
    deletedAt: integer('deleted_at'),
}, (t) => [index('idx_crops_deleted_at').on(t.deletedAt)]);

export const tasks = sqliteTable('tasks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cropId: integer('crop_id').references(() => crops.id),
    stageId: integer('stage_id').references(() => cropFertilizationStages.id),
    title: text('title').notNull(),
    category: text('category', { enum: ['harvest', 'fertilize', 'custom'] }).notNull(),
    source: text('source', { enum: ['auto', 'manual'] }).notNull(),
    block: text('block'),
    scheduledDate: text('scheduled_date').notNull(),
    status: text('status', { enum: ['pending', 'completed'] }).notNull().default('pending'),
    completedAt: integer('completed_at'),
}, (t) => [
    index('idx_tasks_date_status').on(t.scheduledDate, t.status),
    index('idx_tasks_crop').on(t.cropId),
]);

export const sales = sqliteTable('sales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cropId: integer('crop_id').notNull().references(() => crops.id),
    unitsYield: real('units_yield').notNull(),
    pricePerUnit: real('price_per_unit').notNull(),
    saleDate: text('sale_date').notNull(),
}, (t) => [index('idx_sales_date').on(t.saleDate)]);

export const appMeta = sqliteTable('app_meta', {
    key: text('key').primaryKey(),
    value: text('value'),
});