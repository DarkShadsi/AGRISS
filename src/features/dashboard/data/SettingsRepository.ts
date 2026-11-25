// ============ Read and write simple settings in the app_meta table ========

import { eq } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { appMeta } from '../../../core/database/schema';

export const SettingsRepository = {
    get(key: string): string | null {
        return db.select().from(appMeta).where(eq(appMeta.key, key)).get()?.value ?? null;
    },

    set(key: string, value: string): void {
        db.insert(appMeta)
            .values({ key, value })
            .onConflictDoUpdate({ target: appMeta.key, set: { value } })
            .run();
    },
};