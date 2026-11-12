import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import { COLORS } from '../../../shared/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function BarButton({ icon, label, active, onPress }: { icon: IconName; label: string; active: boolean; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
    onPress={onPress}
    className={`flex-1 flex-row items-center justify-center gap-2 min-h-[56px] rounded-2xl border-2 border-primary ${active ? 'bg-primary-soft' : 'bg-surface'}`}
>
    <Ionicons name={icon} size={24} color={COLORS.primary} />
    <AppText weight="semibold" tone="primary">{label}</AppText>
        </Pressable>
);
}

type Props = { summary: string[]; sortActive: boolean; filterActive: boolean; onSort: () => void; onFilter: () => void };

export default function CropSortFilterBar({ summary, sortActive, filterActive, onSort, onFilter }: Props) {
    return (
        <View className="gap-2">
        <View className="flex-row gap-3">
        <BarButton icon="funnel-outline" label="Filter" active={filterActive} onPress={onFilter} />
    <BarButton icon="swap-vertical" label="Sort" active={sortActive} onPress={onSort} />
    </View>
    {summary.map((line) => (
        <AppText variant="label" tone="muted" key={line}>{line}</AppText>
    ))}
    </View>
);
}