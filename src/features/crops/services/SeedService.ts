import { eq } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { appMeta, cropsCatalog, cropFertilizationStages } from '../../../core/database/schema';
import seedJson from '../../../../assets/seed/ph_crops_seed_data.json';

const SEED_VERSION = '1';
const mid = (a: number, b: number) => Math.round((a + b) / 2);

export function seedIfNeeded(): void {
    const current = db.select().from(appMeta).where(eq(appMeta.key, 'seed_version')).get();
    if (current?.value === SEED_VERSION) return;

    db.transaction((tx) => {
        for (const crop of seedJson.crops) {
            const row = tx
                .insert(cropsCatalog)
                .values({
                    englishName: crop.common_name,
                    filipinoName: crop.filipino_name,
                    scientificName: crop.scientific_name,
                    daysToMaturity: mid(crop.days_to_harvest.min, crop.days_to_harvest.max),
                    isOneTimeHarvest: crop.harvest.is_one_time_harvest,
                    harvestInterval: crop.harvest.harvest_interval_days,
                    yieldPerPlant: (crop.yield_per_plant.min + crop.yield_per_plant.max) / 2,
                    unit: crop.yield_per_plant.unit.split(' (')[0],
                })
                .returning({ id: cropsCatalog.id })
                .get();

            tx.insert(cropFertilizationStages)
                .values(
                    crop.fertilization_schedule.map((s, i) => ({
                        cropCatalogId: row.id,
                        stageOrder: i + 1,
                        stageName: s.stage,
                        fertilizer: s.fertilizer,
                        dayOffset: s.schedule.default_day_offset,
                        isRecurring: s.schedule.recurring,
                        intervalDays: s.schedule.default_interval_days,
                        repeatUntilHarvest: s.schedule.repeat_until_harvest,
                    }))
                )
                .run();
        }

        tx.insert(appMeta)
            .values({ key: 'seed_version', value: SEED_VERSION })
            .onConflictDoUpdate({ target: appMeta.key, set: { value: SEED_VERSION } })
            .run();
    });
}