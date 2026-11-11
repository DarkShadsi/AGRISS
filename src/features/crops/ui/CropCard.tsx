import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import { COLORS } from '../../../shared/theme';
import type { CropView } from '../services/CropService';

export function ageText(days: number): string {
    if (days < 0) return `Planting in ${-days} day${days === -1 ? '' : 's'}`;
    return `${days} day${days === 1 ? '' : 's'} old`;
}

export default function CropCard({ crop, onMenu }: { crop: CropView; onMenu: () => void }) {
    return (
        <View className="bg-surface rounded-2xl border border-line p-4">
            <View className="flex-row items-start">
                <AppText variant="heading" weight="bold" style={{ flex: 1 }}>
                    {crop.name}
                </AppText>
                <AppText variant="label" weight="semibold" tone="muted" style={{ marginTop: 8 }}>
                    Block {crop.block}
                </AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Options for ${crop.name}`}
                    onPress={onMenu}
                    className="w-12 h-12 items-center justify-center -mt-1 -mr-2"
                >
                    <Ionicons name="ellipsis-vertical" size={28} color={COLORS.ink} />
                </Pressable>
            </View>
            <AppText tone="muted">
                Age: <AppText weight="semibold" tone="primary">{ageText(crop.ageDays)}</AppText>
            </AppText>
            <AppText tone="muted">
                Quantity: <AppText weight="semibold" tone="primary">{crop.quantity}</AppText>
            </AppText>
        </View>
    );
}