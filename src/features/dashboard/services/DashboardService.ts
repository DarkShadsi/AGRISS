import { CropService, type CropView } from '../../crops/services/CropService';
import { SettingsRepository } from '../data/SettingsRepository';

export const DEFAULT_FARM_NAME = "Rey's farm";
const FARM_NAME_KEY = 'farm_name';

export const DashboardService = {
    getFarmName(): string {
        return SettingsRepository.get(FARM_NAME_KEY)?.trim() || DEFAULT_FARM_NAME;
    },

    /** For a future settings screen. */
    setFarmName(name: string): void {
        SettingsRepository.set(FARM_NAME_KEY, name.trim());
    },

    greeting(now: Date = new Date()): string {
        const h = now.getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    },

    // Returns the five nearest harvest limiting it to one harvest schedule per crop
    getUpcomingHarvests(limit = 5): CropView[] {
        return CropService.getCrops()
            .filter((c) => c.inCatalog && c.harvestInDays !== null && c.harvestInDays >= 0)
            .sort((a, b) => (a.harvestInDays as number) - (b.harvestInDays as number) || a.name.localeCompare(b.name))
            .slice(0, limit);
    },
};