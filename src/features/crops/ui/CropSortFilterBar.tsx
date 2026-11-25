// ==============  CONTAINS THE FILTER AND SORT UI COMPONENTS =============

import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import { COLORS } from '../../../shared/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function BarButton({
    icon,
    label,
    active,
    onPress,
    compact = false,
}: {
    icon: IconName;
    label: string;
    active: boolean;
    onPress: () => void;
    compact?: boolean;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            className={`flex-1 flex-row items-center justify-center gap-2 ${
                compact ? 'min-h-[44px]' : 'min-h-[56px]'
            } rounded-2xl border-2 border-primary ${active ? 'bg-primary-soft' : 'bg-surface'}`}
        >
            <Ionicons name={icon} size={compact ? 20 : 24} color={COLORS.primary} />
            <AppText weight="semibold" tone="primary">{label}</AppText>
        </Pressable>
    );
}

type Props = {
    summary: string[];
    sortActive: boolean;
    filterActive: boolean;
    onSort: () => void;
    onFilter: () => void;
    compact?: boolean;
};

export default function CropSortFilterBar({ summary, sortActive, filterActive, onSort, onFilter, compact = false }: Props) {
    return (
        <View className="gap-2">
            <View className={`flex-row ${compact ? 'gap-1' : 'gap-3'}`}>
                <BarButton icon="funnel-outline" label="Filter" active={filterActive} onPress={onFilter} compact={compact} />
                <BarButton icon="swap-vertical" label="Sort" active={sortActive} onPress={onSort} compact={compact} />
            </View>
            {summary.map((line) => (
                <AppText variant="label" tone="muted" key={line}>{line}</AppText>
            ))}
        </View>
    );
}