// ========== The header card with the greeting, farm name, date, and the "+" button. =========

import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import { COLORS } from '../../../shared/theme';

type Props = { greeting: string; dateText: string; farmName: string; onAdd: () => void };

export default function HomeHeader({ greeting, dateText, farmName, onAdd }: Props) {
    return (
        <View className="bg-surface rounded-2xl border border-line p-4 flex-1 justify-between w-full">
            <View className="flex-1 flex-row items-center justify-between">
                <AppText variant="label" tone="muted">{greeting}</AppText>
                <AppText variant="label" tone="muted">{dateText}</AppText>
            </View>
            <View className="flex-1 flex-row items-center justify-between">
                <AppText variant="display" weight="bold" tone="primary">{farmName}</AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add crop"
                    onPress={onAdd}
                    className="w-14 h-14 rounded-2xl border-2 border-primary bg-primary-soft items-center justify-center active:opacity-70"
                >
                    <Ionicons name="add" size={36} color={COLORS.primary} />
                </Pressable>
            </View>
        </View>
    );
}