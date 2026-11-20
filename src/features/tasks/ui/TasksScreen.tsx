import { useCallback, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { like } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { tasks as tasksTable } from '../../../core/database/schema';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import FabButton from '../../../shared/components/FabButton';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import { OptionsPopup } from '../../../shared/components/Popup';
import { COLORS } from '../../../shared/theme';
import { addDays, todayString } from '../../../shared/utils/dates';
import { CropService } from '../../crops/services/CropService';
import { TaskRepository } from '../data/TaskRepository';
import { TaskService, type TaskCategory, type TaskSection } from '../services/TaskService';
import TaskCard from './TaskCard';
import { useTaskActions } from './useTaskActions';
import { useTaskForm } from './useTaskForm';
import TaskCalendar from './TaskCalendar';
import ActivityLog from './ActivityLog';

// =========== THE MAIN SCREEN FOR THE TASKS TAB ===========

type Filter = 'all' | TaskCategory;
const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All tasks' },
    { value: 'harvest', label: 'Harvest' },
    { value: 'fertilize', label: 'Fertilize' },
    { value: 'custom', label: 'Custom' },
];

export default function TasksScreen() {
    const [tab, setTab] = useState<'tasks' | 'log'>('tasks');
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [filter, setFilter] = useState<Filter>('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const [sections, setSections] = useState<TaskSection[]>([]);

    const [version, setVersion] = useState(0);
    const reload = useCallback(() => {
        setSections(TaskService.getListSections(filter));
        setVersion((v) => v + 1);
    }, [filter]);
    useFocusEffect(reload);

    const taskForm = useTaskForm({ onChanged: reload });
    const actions = useTaskActions({ onChanged: reload, onEdit: taskForm.openEdit });

    // TEMPORARY test helpers (shown only while testing in Expo Go)
    const addSamples = () => {
        const today = todayString();
        const block = CropService.getCrops()[0]?.block ?? null;
        const make = (title: string, offset: number) =>
            TaskRepository.insert({
                title, category: 'custom', source: 'manual', cropId: null, stageId: null,
                block, scheduledDate: addDays(today, offset), status: 'pending',
            });
        make('ZZ Weed', -2);
        make('ZZ Spray', 0);
        make('ZZ Water', 1);
        make('ZZ Prune', 3);
        reload();
    };
    const clearSamples = () => {
        db.delete(tasksTable).where(like(tasksTable.title, 'ZZ%')).run();
        reload();
    };

    return (
        <ScreenContainer>
            <View className="px-4 pt-3 gap-3">
                <SegmentedControl
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'tasks', label: 'My Tasks' },
                        { value: 'log', label: 'Activity log' },
                    ]}
                />
                {tab === 'tasks' && (
                    <>
                        <View className="flex-row items-center gap-2">
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setFilterOpen(true)}
                                className={`flex-row items-center justify-center gap-1 min-h-[52px] px-3 rounded-2xl border-2 border-primary ${
                                    filter !== 'all' ? 'bg-primary-soft' : 'bg-surface'
                                }`}
                            >
                                <Ionicons name="funnel-outline" size={20} color={COLORS.primary} />
                                <AppText variant="label" weight="semibold" tone="primary">Filter</AppText>
                            </Pressable>
                            <View style={{ flex: 1 }}>
                                <SegmentedControl
                                    compact
                                    value={view}
                                    onChange={setView}
                                    options={[
                                        { value: 'list', label: 'List', icon: 'list' },
                                        { value: 'calendar', label: 'Calendar', icon: 'calendar' },
                                    ]}
                                />
                            </View>
                        </View>
                        {filter !== 'all' && (
                            <AppText variant="label" tone="muted">
                                {`Showing: ${FILTERS.find((f) => f.value === filter)?.label} tasks`}
                            </AppText>
                        )}
                        {__DEV__ && (
                            <View className="flex-row gap-3">
                                <View style={{ flex: 1 }}><AppButton title="TEMP add" variant="secondary" onPress={addSamples} /></View>
                                <View style={{ flex: 1 }}><AppButton title="TEMP clear" variant="danger" onPress={clearSamples} /></View>
                            </View>
                        )}
                    </>
                )}
            </View>

            {tab === 'log' ? (
                <ActivityLog refreshKey={version} />
            ) : view === 'calendar' ? (
                <TaskCalendar category={filter} refreshKey={version} />
            ) : (
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
                            tone={section.key === 'overdue' ? 'danger' : 'primary'}
                            style={{ paddingTop: 14, paddingBottom: 8, backgroundColor: COLORS.page }}
                        >
                            {section.title}
                        </AppText>
                    )}
                    renderItem={({ item }) => (
                        <TaskCard task={item} onToggle={() => actions.complete(item)} onInfo={() => actions.openMenu(item)} />
                    )}
                    ListEmptyComponent={
                        <AppText tone="muted" style={{ textAlign: 'center', marginTop: 32 }}>
                            No upcoming tasks. Add a crop to get automatic tasks, or tap + to add your own.
                        </AppText>
                    }
                />
            )}

            <FabButton label="Add task" onPress={taskForm.openAdd} />

            <OptionsPopup
                visible={filterOpen}
                title="Show tasks"
                onClose={() => setFilterOpen(false)}
                options={FILTERS.map((f) => ({
                    label: f.label,
                    variant: filter === f.value ? 'primary' : 'secondary',
                    onPress: () => { setFilter(f.value); setFilterOpen(false); },
                }))}
            />
            {taskForm.dialogs}
            {actions.dialogs}
        </ScreenContainer>
    );
}