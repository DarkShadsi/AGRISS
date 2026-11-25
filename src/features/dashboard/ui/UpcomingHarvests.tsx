// ======= The harvest cards. Tapping one reports which crop was tapped, so the screen can open its Info popup. ======

import { Pressable, View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import { ageText } from '../../crops/ui/CropCard';
import type { CropView } from '../../crops/services/CropService';

function harvestWording(days: number): string {
    if (days === 0) return 'Harvest today';
    if (days === 1) return 'Harvest tomorrow';
    return `Harvest in ${days} days`;
}

type Props = { crops: CropView[]; onPress: (crop: CropView) => void };

export default function UpcomingHarvests({ crops, onPress }: Props) {
    return (
        <View style={{ gap: 10 }}>
            {crops.map((c) => (
                <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    onPress={() => onPress(c)}
                    className="bg-surface rounded-2xl border border-line p-4 active:bg-primary-soft"
                >
                    <AppText weight="bold">{`${c.name} (Block ${c.block})`}</AppText>
                    <View className="flex-row items-center justify-between gap-2">
                        <AppText weight="semibold" tone="primary">{harvestWording(c.harvestInDays ?? 0)}</AppText>
                        <AppText variant="label" tone="muted">{ageText(c.ageDays)}</AppText>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}