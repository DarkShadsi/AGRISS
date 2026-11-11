import { useState } from 'react';
import { View } from 'react-native';
import { eq } from 'drizzle-orm';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import { db } from '../../../core/database/client';
import { crops, tasks } from '../../../core/database/schema';
import { CropService } from '../../crops/services/CropService';
import { addDays, todayString } from '../../../shared/utils/dates';

export default function HomeScreen() {
    const [lines, setLines] = useState<string[]>([]);

    const runTest = () => {
        const today = todayString();
        const bad = CropService.addCrop({ name: ' ', block: '', quantity: '0', plantingDate: today });
        const t = CropService.addCrop({ name: 'tomato', block: '1', quantity: '200', plantingDate: addDays(today, -10) });
        const p = CropService.addCrop({ name: 'Pineapple', block: '2', quantity: '50', plantingDate: today });
        if (!t.ok || !p.ok) { setLines(['Add failed']); return; }

        const view = (id: number) => CropService.getCrops().find((c) => c.id === id);
        const a = view(t.crop.id);
        const b = view(p.crop.id);

        CropService.deleteCrop(p.crop.id);
        const hidden = CropService.getCrops().length;
        CropService.cancelPendingDelete(p.crop.id);
        const restored = CropService.getCrops().length;
        CropService.deleteCrop(p.crop.id);
        CropService.commitDelete(p.crop.id);
        const gone = CropService.getCrops().length;

        CropService.updateCrop(t.crop.id, { name: 'Tomato', block: '1', quantity: '200', plantingDate: addDays(today, -20) });
        const edited = view(t.crop.id);

        [t.crop.id, p.crop.id].forEach((id) => {
            db.delete(tasks).where(eq(tasks.cropId, id)).run();
            db.delete(crops).where(eq(crops.id, id)).run();
        });

        setLines([
            `Empty form errors: ${bad.ok ? 'none' : Object.keys(bad.errors).join(', ')}`,
            `Tomato: catalog=${a?.inCatalog}, age=${a?.ageDays}, harvest in ${a?.harvestInDays}`,
            `Pineapple: catalog=${b?.inCatalog}, unit=${b?.unit}, harvest=${b?.harvestInDays}`,
            `Delete / undo / delete: ${hidden} -> ${restored} -> ${gone}`,
            `After date edit: age=${edited?.ageDays}, harvest in ${edited?.harvestInDays}`,
        ]);
    };

    return (
        <ScreenContainer>
            <View className="flex-1 p-5 gap-4">
                <AppButton title="Run crop test" onPress={runTest} />
                {lines.map((l) => (
                    <AppText key={l}>{l}</AppText>
                ))}
            </View>
        </ScreenContainer>
    );
}