import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import { COLORS } from '../../../shared/theme';
import CategoryBadge from './CategoryBadge';
import type { TaskView } from '../services/TaskService';

type Props = { task: TaskView; onToggle: () => void; onInfo: () => void };

export default function TaskCard({ task, onToggle, onInfo }: Props) {
    return (
        <View
            className={`bg-surface rounded-2xl p-3 flex-row items-center gap-3 ${
                task.isOverdue ? 'border-2 border-danger' : 'border border-line'
            }`}
        >
            <CategoryBadge category={task.category} />
            <View style={{ flex: 1 }}>
                <AppText weight="semibold">{task.label}</AppText>
                {task.subtitle ? <AppText variant="label" tone="muted">{task.subtitle}</AppText> : null}
                {task.isOverdue ? (
                    <AppText variant="label" weight="semibold" tone="danger">
                        {`Overdue: ${task.daysLate} day${task.daysLate === 1 ? '' : 's'} late`}
                    </AppText>
                ) : null}
            </View>
            {task.canComplete && (
                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Mark ${task.label} as done`}
                    onPress={onToggle}
                    className="w-12 h-12 items-center justify-center"
                >
                    <Ionicons name="square-outline" size={36} color={COLORS.primary} />
                </Pressable>
            )}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Options for ${task.label}`}
                onPress={onInfo}
                className="w-12 h-12 items-center justify-center"
            >
                <Ionicons name="information-circle-outline" size={36} color={COLORS.primary} />
            </Pressable>
        </View>
    );
}