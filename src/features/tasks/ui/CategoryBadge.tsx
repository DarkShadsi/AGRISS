import { View } from 'react-native';
import AppText from '../../../shared/components/AppText';
import { COLORS } from '../../../shared/theme';
import type { TaskCategory } from '../services/TaskService';

export const CATEGORY_COLOR: Record<TaskCategory, string> = {
    harvest: COLORS.harvest,
    fertilize: COLORS.fertilize,
    custom: COLORS.custom,
};

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
    harvest: 'Harvest',
    fertilize: 'Fertilize',
    custom: 'Custom',
};

type Props = { category: TaskCategory; size?: number; count?: number };

export default function CategoryBadge({ category, size = 28, count }: Props) {
    const inner = category === 'custom' ? size * 0.74 : size;
    const radius = category === 'harvest' ? inner / 2 : category === 'fertilize' ? inner * 0.2 : inner * 0.12;
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View
                style={{
                    width: inner,
                    height: inner,
                    borderRadius: radius,
                    backgroundColor: CATEGORY_COLOR[category],
                    transform: category === 'custom' ? [{ rotate: '45deg' }] : [],
                }}
            />
            {count !== undefined && (
                <AppText
                    weight="bold"
                    tone="inverse"
                    style={{ position: 'absolute', fontSize: 16, lineHeight: 20 }}
                >
                    {count}
                </AppText>
            )}
        </View>
    );
}