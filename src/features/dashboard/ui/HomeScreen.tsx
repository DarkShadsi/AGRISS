import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { like } from 'drizzle-orm';
import { db } from '../../../core/database/client';
import { tasks as tasksTable } from '../../../core/database/schema';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import { MessagePopup, OptionsPopup } from '../../../shared/components/Popup';
import { addDays, formatLongDate, todayString } from '../../../shared/utils/dates';
import { CropService, type CropView } from '../../crops/services/CropService';
import CropFormPopup from '../../crops/ui/CropFormPopup';
import CropInfoPopup from '../../crops/ui/CropInfoPopup';
import CropSortFilterBar from '../../crops/ui/CropSortFilterBar';
import { TaskRepository } from '../../tasks/data/TaskRepository';
import { TaskService, type TaskCategory, type TaskView } from '../../tasks/services/TaskService';
import TaskCard from '../../tasks/ui/TaskCard';
import { useTaskActions } from '../../tasks/ui/useTaskActions';
import { useTaskForm } from '../../tasks/ui/useTaskForm';
import { DashboardService } from '../services/DashboardService';
import HomeHeader from './HomeHeader';
import UpcomingHarvests from './UpcomingHarvests';

type Sort = 'block' | 'category';
type Filter = 'all' | TaskCategory;
const SORTS: { value: Sort; label: string }[] = [
    { value: 'block', label: 'Block (1, 2, 3...)' },
    { value: 'category', label: 'Category' },
];
const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All tasks' },
    { value: 'harvest', label: 'Harvest' },
    { value: 'fertilize', label: 'Fertilize' },
    { value: 'custom', label: 'Custom' },
];

export default function HomeScreen() {
    const [sort, setSort] = useState<Sort>('block');
    const [category, setCategory] = useState<Filter>('all');
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [todayTasks, setTodayTasks] = useState<TaskView[]>([]);
    const [harvests, setHarvests] = useState<CropView[]>([]);
    const [farmName, setFarmName] = useState('');
    const [now, setNow] = useState(new Date());
    const [addCropOpen, setAddCropOpen] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [infoFor, setInfoFor] = useState<CropView | null>(null);

    // Reload whenever the screen is focused, a change is made, or the sort/filter changes.
    const [tick, setTick] = useState(0);
    const reload = useCallback(() => setTick((t) => t + 1), []);
    useFocusEffect(reload);
    useEffect(() => {
        setTodayTasks(TaskService.getTodayViews({ sort, category }));
        setHarvests(DashboardService.getUpcomingHarvests());
        setFarmName(DashboardService.getFarmName());
        setNow(new Date());
    }, [sort, category, tick]);

    const taskForm = useTaskForm({ onChanged: reload });
    const actions = useTaskActions({ onChanged: reload, onEdit: taskForm.openEdit });

    // TEMPORARY test helpers (dev only; removed at the end of Phase 6)
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
        reload();
    };
    const clearSamples = () => {
        db.delete(tasksTable).where(like(tasksTable.title, 'ZZ%')).run();
        reload();
    };

    const summary: string[] = [];
    if (sort !== 'block') summary.push('Sorted by: Category');
    if (category !== 'all') summary.push(`Showing: ${FILTERS.find((f) => f.value === category)?.label} tasks`);

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
                <HomeHeader
                    greeting={DashboardService.greeting(now)}
                    dateText={formatLongDate(todayString())}
                    farmName={farmName}
                    onAdd={() => setAddCropOpen(true)}
                />

                <View style={{ gap: 10 }}>
                    <View className="flex-row items-center gap-2">
                        <AppText variant="heading" weight="bold" tone="primary">
                            Today's tasks
                        </AppText>
                        <View style={{ flex: 1 }}>
                            <CropSortFilterBar
                                summary={summary}
                                sortActive={sort !== 'block'}
                                filterActive={category !== 'all'}
                                onSort={() => setSortOpen(true)}
                                onFilter={() => setFilterOpen(true)}
                                compact
                            />
                        </View>
                    </View>
                    {__DEV__ && (
                        <View className="flex-row gap-3">
                            <View style={{ flex: 1 }}><AppButton title="TEMP add" variant="secondary" onPress={addSamples} /></View>
                            <View style={{ flex: 1 }}><AppButton title="TEMP clear" variant="danger" onPress={clearSamples} /></View>
                        </View>
                    )}
                    {todayTasks.length === 0 ? (
                        <AppText tone="muted">No tasks for today.</AppText>
                    ) : (
                        todayTasks.map((t) => (
                            <TaskCard key={t.id} task={t} onToggle={() => actions.complete(t)} onInfo={() => actions.openMenu(t)} />
                        ))
                    )}
                </View>

                <View style={{ gap: 10 }}>
                    <AppText variant="heading" weight="bold" tone="primary">Upcoming harvests</AppText>
                    {harvests.length === 0 ? (
                        <AppText tone="muted">No upcoming harvests.</AppText>
                    ) : (
                        <UpcomingHarvests crops={harvests} onPress={setInfoFor} />
                    )}
                </View>
            </ScrollView>

            <CropFormPopup
                visible={addCropOpen}
                mode="add"
                onClose={() => setAddCropOpen(false)}
                onSaved={(message) => { reload(); setNotice(message); }}
            />
            <MessagePopup visible={!!notice} message={notice ?? ''} onClose={() => setNotice(null)} />
            <CropInfoPopup crop={infoFor} onClose={() => setInfoFor(null)} />

            <OptionsPopup
                visible={sortOpen}
                title="Sort today's tasks by"
                onClose={() => setSortOpen(false)}
                options={SORTS.map((s) => ({
                    label: s.label,
                    variant: sort === s.value ? 'primary' : 'secondary',
                    onPress: () => { setSort(s.value); setSortOpen(false); },
                }))}
            />
            <OptionsPopup
                visible={filterOpen}
                title="Show tasks"
                onClose={() => setFilterOpen(false)}
                options={FILTERS.map((f) => ({
                    label: f.label,
                    variant: category === f.value ? 'primary' : 'secondary',
                    onPress: () => { setCategory(f.value); setFilterOpen(false); },
                }))}
            />
            {taskForm.dialogs}
            {actions.dialogs}
        </ScreenContainer>
    );
}