import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { crops, cropsCatalog } from '../../../core/database/schema';
import type { CatalogCrop } from './CatalogRepository';

export type Crop = typeof crops.$inferSelect;
export type NewCrop = typeof crops.$inferInsert;
export type CropWithCatalog = { crop: Crop; catalog: CatalogCrop | null };

const baseQuery = () =>
    db
        .select({ crop: crops, catalog: cropsCatalog })
        .from(crops)
        .leftJoin(cropsCatalog, eq(crops.catalogId, cropsCatalog.id));

export function cropName(item: CropWithCatalog): string {
    return item.catalog?.englishName ?? item.crop.customName ?? 'Unnamed crop';
}

export const CropRepository = {
    findActive(): CropWithCatalog[] {
        return baseQuery()
            .where(isNull(crops.deletedAt))
            .orderBy(asc(crops.plantingDate), asc(crops.id))
            .all();
    },

    findById(id: number): CropWithCatalog | undefined {
        return baseQuery().where(and(eq(crops.id, id), isNull(crops.deletedAt))).get();
    },

    insert(data: Omit<NewCrop, 'id'>): Crop {
        return db.insert(crops).values(data).returning().get();
    },

    update(
        id: number,
        data: Partial<Pick<NewCrop, 'catalogId' | 'customName' | 'block' | 'quantity' | 'plantingDate'>>
    ): void {
        db.update(crops).set(data).where(eq(crops.id, id)).run();
    },

    softDelete(id: number): void {
        db.update(crops).set({ deletedAt: Date.now() }).where(eq(crops.id, id)).run();
    },

    restore(id: number): void {
        db.update(crops).set({ deletedAt: null }).where(eq(crops.id, id)).run();
    },
};