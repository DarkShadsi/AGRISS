// ============ CROP SERVICES WILL USE THIS TO FETCH CROP CATALOG DATA FROM THE DATABASE ==========

import { asc, eq, like, or } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { cropsCatalog, cropFertilizationStages } from '../../../core/database/schema';

export type CatalogCrop = typeof cropsCatalog.$inferSelect;
export type FertilizationStage = typeof cropFertilizationStages.$inferSelect;

export const CatalogRepository = {
    // Returns at most 8 rows that matches the inputted crop name
    findByName(query: string, limit = 8): CatalogCrop[] {
        const q = `%${query.trim()}%`;
        return db
            .select()
            .from(cropsCatalog)
            .where(or(like(cropsCatalog.englishName, q), like(cropsCatalog.filipinoName, q)))
            .orderBy(asc(cropsCatalog.englishName))
            .limit(limit)
            .all();
    },

    // Returns the crop that matches the id
    findById(id: number): CatalogCrop | undefined {
        return db.select().from(cropsCatalog).where(eq(cropsCatalog.id, id)).get();
    },

    // Returns the fertilization stages of a crop using its catalogID
    getStages(catalogId: number): FertilizationStage[] {
        return db
            .select()
            .from(cropFertilizationStages)
            .where(eq(cropFertilizationStages.cropCatalogId, catalogId))
            .orderBy(asc(cropFertilizationStages.stageOrder))
            .all();
    },
};