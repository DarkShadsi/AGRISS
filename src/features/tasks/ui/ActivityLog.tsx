import { useCallback, useEffect, useState } from 'react';
import { ScrollView, SectionList, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import Dropdown from '../../../shared/components/Dropdown';
import { OptionsPopup, Popup } from '../../../shared/components/Popup';
import { COLORS } from '../../../shared/theme';
import CropSortFilterBar from '../../crops/ui/CropSortFilterBar';
import { TaskService, type LogSort, type TaskCategory, type TaskSection, type TaskView } from '../services/TaskService';
import CategoryBadge from './CategoryBadge';

// =========== SHOWS COMPLETED TASKS AND THE FILTERS FOR THE ACTIVITY LOG ===========

const ALL = '__all__';
const SORTS: { value: LogSort; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
];
const CATEGORIES: { value: 'all' | TaskCategory; label: string }[] = [
    { value: 'all', label: 'All tasks' },
    { value: 'harvest', label: 'Harvest' },
    { value: 'fertilize', label: 'Fertilize' },
    { value: 'custom', label: 'Custom' },
];

function LogCard({ task }: { task: TaskView }) {
    return (
        <View className="bg-surface rounded-2xl border border-line p-3 flex-row items-center gap-3">
            <CategoryBadge category={task.category} />
            <View style={{ flex: 1 }}>
                <AppText weight="semibold">{task.label}</AppText>
                {task.subtitle ? <AppText variant="label" tone="muted">{task.subtitle}</AppText> : null}
            </View>
            <Ionicons name="checkmark-circle" size={30} color={COLORS.primary} accessibilityLabel="Done" />
        </View>
    );
}

export default function ActivityLog({ refreshKey }: { refreshKey: number }) {
    const [sort, setSort] = useState<LogSort>('newest');
    const [category, setCategory] = useState<'all' | TaskCategory>('all');
    const [block, setBlock] = useState<string | null>(null);
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sections, setSections] = useState<TaskSection[]>([]);
    const [blocks, setBlocks] = useState<string[]>([]);

    const [focusTick, setFocusTick] = useState(0);
    useFocusEffect(
        useCallback(() => {
            setFocusTick((t) => t + 1);
        }, [])
    );
    useEffect(() => {
        setSections(TaskService.getActivityLog({ sort, category, block }));
        setBlocks(TaskService.getLogBlocks());
    }, [sort, category, block, refreshKey, focusTick]);

    const filterActive = category !== 'all' || block !== null;
    const summary: string[] = [];
    if (sort !== 'newest') summary.push('Sorted by: Oldest first');
    if (filterActive) {
        const parts: string[] = [];
        if (category !== 'all') parts.push(CATEGORIES.find((c) => c.value === category)?.label ?? '');
        if (block !== null) parts.push(`Block ${block}`);
        summary.push(`Showing: ${parts.join(', ')}`);
    }

    const blockOptions = [
        { value: ALL, label: 'All blocks' },
        ...(block !== null && !blocks.includes(block) ? [block, ...blocks] : blocks).map((b) => ({
            value: b,
            label: `Block ${b}`,
        })),
    ];

    return (
        <View style={{ flex: 1 }}>
            <View className="px-4 pt-3">
                <CropSortFilterBar
                    summary={summary}
                    sortActive={sort !== 'newest'}
                    filterActive={filterActive}
                    onSort={() => setSortOpen(true)}
                    onFilter={() => setFilterOpen(true)}
                />
            </View>

            <SectionList
                sections={sections.map((s) => ({ key: s.key, title: s.title, data: s.tasks }))}
                keyExtractor={(t) => String(t.id)}
                stickySectionHeadersEnabled
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderSectionHeader={({ section }) => (
                    <AppText
                        variant="subheading"
                        weight="bold"
                        tone="primary"
                        style={{ paddingTop: 14, paddingBottom: 8, backgroundColor: COLORS.page }}
                    >
                        {section.title}
                    </AppText>
                )}
                renderItem={({ item }) => <LogCard task={item} />}
                ListEmptyComponent={
                    <AppText tone="muted" style={{ textAlign: 'center', marginTop: 32 }}>
                        {filterActive ? 'No finished tasks match your filter.' : 'No finished tasks yet.'}
                    </AppText>
                }
            />

            <OptionsPopup
                visible={sortOpen}
                title="Sort log by"
                onClose={() => setSortOpen(false)}
                options={SORTS.map((s) => ({
                    label: s.label,
                    variant: sort === s.value ? 'primary' : 'secondary',
                    onPress: () => { setSort(s.value); setSortOpen(false); },
                }))}
            />

            <Popup visible={filterOpen} onClose={() => setFilterOpen(false)}>
                <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>Filter log</AppText>
                <ScrollView style={{ flexShrink: 1 }} nestedScrollEnabled>
                    <AppText weight="semibold" style={{ marginBottom: 8 }}>Category</AppText>
                    <View className="gap-2 mb-4">
                        {CATEGORIES.map((c) => (
                            <AppButton
                                key={c.value}
                                title={c.label}
                                variant={category === c.value ? 'primary' : 'secondary'}
                                onPress={() => setCategory(c.value)}
                            />
                        ))}
                    </View>
                    <AppText weight="semibold" style={{ marginBottom: 8 }}>Block</AppText>
                    <Dropdown
                        value={block ?? ALL}
                        options={blockOptions}
                        onChange={(v) => setBlock(v === ALL ? null : v)}
                    />
                </ScrollView>
                <View className="gap-2" style={{ marginTop: 16 }}>
                    <AppButton
                        title="Show all"
                        variant="secondary"
                        onPress={() => { setCategory('all'); setBlock(null); }}
                    />
                    <AppButton title="Done" onPress={() => setFilterOpen(false)} />
                </View>
            </Popup>
        </View>
    );
}