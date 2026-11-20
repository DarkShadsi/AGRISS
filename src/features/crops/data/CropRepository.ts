// =========== CROP SERVICES WILL USE THIS TO FETCH ACTUAL CROP DATA FROM THE DATABASE =========

import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { crops, cropsCatalog } from '../../../core/database/schema';
import type { CatalogCrop } from './CatalogRepository';

export type Crop = typeof crops.$inferSelect;
export type NewCrop = typeof crops.$inferInsert;
export type CropWithCatalog = { crop: Crop; catalog: CatalogCrop | null };

// Query-builder that constructs a reusable SELECT joining Crops with the Crops Catalog
const baseQuery = () =>
    db
        .select({ crop: crops, catalog: cropsCatalog })
        .from(crops)
        .leftJoin(cropsCatalog, eq(crops.catalogId, cropsCatalog.id));

// Returns the crop name
export function cropName(item: CropWithCatalog): string {
    return item.catalog?.englishName ?? item.crop.customName ?? 'Unnamed crop';
}

export const CropRepository = {
    // Returns active/not deleted crops
    findActive(): CropWithCatalog[] {
        return baseQuery()
            .where(isNull(crops.deletedAt))
            .orderBy(asc(crops.plantingDate), asc(crops.id))
            .all();
    },

    // Returns a crop that matches the id
    findById(id: number): CropWithCatalog | undefined {
        return baseQuery().where(and(eq(crops.id, id), isNull(crops.deletedAt))).get();
    },

    // Insert new crop to the database
    insert(data: Omit<NewCrop, 'id'>): Crop {
        return db.insert(crops).values(data).returning().get();
    },

    // Update an existing crop on the database
    update(
        id: number,
        data: Partial<Pick<NewCrop, 'catalogId' | 'customName' | 'block' | 'quantity' | 'unit' | 'plantingDate' | 'fertilizeTasksUntil' | 'harvestTasksUntil'>>
    ): void {
        db.update(crops).set(data).where(eq(crops.id, id)).run();
    },

    // Soft delete a crop (can still be undone)
    softDelete(id: number): void {
        db.update(crops).set({ deletedAt: Date.now() }).where(eq(crops.id, id)).run();
    },

    // Restores a soft deleted crop
    restore(id: number): void {
        db.update(crops).set({ deletedAt: null }).where(eq(crops.id, id)).run();
    },
};