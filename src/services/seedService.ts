import { db } from '../db/client';
import { cropsCatalog, cropTasksTemplate } from '../db/schema';

export async function seedDatabase(seedData: any[]) {
    console.log('🌱 Starting database seeding...');

    try {
        for (const crop of seedData) {
            if (!crop) continue;

            // 1. Insert the Crop into the catalog
            // Mapping 'days_to_harvest.min' as the basis for growth cycle
            await db.insert(cropsCatalog).values({
                id: crop.id || `temp_${Math.random()}`,
                name: crop.common_name || 'Unknown Crop',
                variety: crop.variety || 'Standard',
                growthCycleDays: crop.days_to_harvest?.min || 0,
            }).onConflictDoNothing();

            // 2. Insert the Task Templates
            if (crop.fertilization_schedule &&
                Array.isArray(crop.fertilization_schedule)) {
                const templates = crop.fertilization_schedule.map((task: any) => {
                    // The actual data is inside the 'schedule' object
                    const sched = task.schedule || {};

                    return {
                        id: `${crop.id}_${task.stage?.replace(/\s+/g, '_').toLowerCase() ||
                        'task'}`,
                        cropId: crop.id,
                        taskName: task.stage || 'General Task',
                        dayOffset: sched.default_day_offset || 0,
                        intervalDays: sched.recurring ? sched.default_interval_days : null,
                        description: `Scheduled ${task.stage || 'task'} for
  ${crop.common_name || 'crop'}`,
                    };
                });

                await
                    db.insert(cropTasksTemplate).values(templates).onConflictDoNothing();
            }
        }
        console.log('✅  Database seeded successfully!');
    } catch (error) {
        console.error('❌  Seeding failed:', error);
        throw error;
    }
}