import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import { Popup } from '../../../shared/components/Popup';
import { COLORS } from '../../../shared/theme';
import { formatLongDate, toDateString, todayString } from '../../../shared/utils/dates';
import { TaskService, type TaskCategory, type TaskView } from '../services/TaskService';
import CategoryBadge, { CATEGORY_LABEL } from './CategoryBadge';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORIES: TaskCategory[] = ['harvest', 'fertilize', 'custom'];

type Props = { category: 'all' | TaskCategory; refreshKey: number };

export default function TaskCalendar({ category, refreshKey }: Props) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [views, setViews] = useState<TaskView[]>([]);
    const [dayOpen, setDayOpen] = useState<string | null>(null);

    const load = useCallback(
        () => setViews(TaskService.getMonthViews(year, month, category)),
        [year, month, category, refreshKey]
    );
    useFocusEffect(load);

    const shift = (delta: number) => {
        const d = new Date(year, month + delta, 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
    };

    const byDate = new Map<string, TaskView[]>();
    for (const v of views) {
        const list = byDate.get(v.scheduledDate) ?? [];
        list.push(v);
        byDate.set(v.scheduledDate, list);
    }

    const leading = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array<null>(leading).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const today = todayString();
    const dayTasks = dayOpen ? byDate.get(dayOpen) ?? [] : [];

    return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
            <View className="flex-row items-center justify-between mb-2">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                    onPress={() => shift(-1)}
                    className="w-12 h-12 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={30} color={COLORS.primary} />
                </Pressable>
                <AppText variant="heading" weight="bold" tone="primary">{`${MONTHS[month]} ${year}`}</AppText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next month"
                    onPress={() => shift(1)}
                    className="w-12 h-12 items-center justify-center"
                >
                    <Ionicons name="chevron-forward" size={30} color={COLORS.primary} />
                </Pressable>
            </View>

            <View className="flex-row">
                {WEEKDAYS.map((w) => (
                    <View key={w} style={{ flex: 1, alignItems: 'center', paddingBottom: 4 }}>
                        <AppText variant="label" weight="semibold" tone="muted">{w}</AppText>
                    </View>
                ))}
            </View>

            {weeks.map((week, wi) => (
                <View key={wi} className="flex-row">
                    {week.map((day, di) => {
                        if (day === null) return <View key={di} style={{ flex: 1, margin: 1 }} />;
                        const date = toDateString(new Date(year, month, day));
                        const list = byDate.get(date) ?? [];
                        const counts = CATEGORIES.map((c) => ({ c, n: list.filter((t) => t.category === c).length })).filter(
                            (x) => x.n > 0
                        );
                        const isToday = date === today;
                        return (
                            <Pressable
                                key={di}
                                accessibilityRole="button"
                                accessibilityLabel={`${formatLongDate(date)}, ${list.length} task${list.length === 1 ? '' : 's'}`}
                                onPress={() => setDayOpen(date)}
                                style={{
                                    flex: 1,
                                    minHeight: 80,
                                    margin: 1,
                                    padding: 2,
                                    alignItems: 'center',
                                    borderRadius: 10,
                                    borderWidth: isToday ? 2 : 1,
                                    borderColor: isToday ? COLORS.primary : COLORS.line,
                                    backgroundColor: isToday ? COLORS.primarySoft : COLORS.surface,
                                }}
                            >
                                <AppText variant="label" weight={isToday ? 'bold' : 'semibold'} tone={isToday ? 'primary' : 'ink'}>
                                    {day}
                                </AppText>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                                    {counts.map(({ c, n }) => (
                                        <CategoryBadge key={c} category={c} size={22} count={n} />
                                    ))}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            ))}

            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mt-4">
                {CATEGORIES.map((c) => (
                    <View key={c} className="flex-row items-center gap-2">
                        <CategoryBadge category={c} size={22} />
                        <AppText variant="label">{CATEGORY_LABEL[c]}</AppText>
                    </View>
                ))}
            </View>
            <AppText variant="label" tone="muted" style={{ marginTop: 6 }}>
                The number inside a shape is how many tasks of that kind are on that day. Tap a day to see them.
            </AppText>

            <Popup visible={dayOpen !== null} onClose={() => setDayOpen(null)}>
                <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>
                    {dayOpen ? formatLongDate(dayOpen) : ''}
                </AppText>
                <ScrollView style={{ flexShrink: 1 }}>
                    {dayTasks.length === 0 ? (
                        <AppText tone="muted">No tasks on this day.</AppText>
                    ) : (
                        dayTasks.map((t) => (
                            <View key={t.id} className="flex-row items-center gap-3 py-2 border-b border-line">
                                <CategoryBadge category={t.category} />
                                <View style={{ flex: 1 }}>
                                    <AppText weight="semibold">{t.label}</AppText>
                                    {t.subtitle ? <AppText variant="label" tone="muted">{t.subtitle}</AppText> : null}
                                    {t.isOverdue ? (
                                        <AppText variant="label" weight="semibold" tone="danger">
                                            {`Overdue: ${t.daysLate} day${t.daysLate === 1 ? '' : 's'} late`}
                                        </AppText>
                                    ) : null}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
                <View style={{ marginTop: 16 }}>
                    <AppButton title="Close" onPress={() => setDayOpen(null)} />
                </View>
            </Popup>
        </ScrollView>
    );
}