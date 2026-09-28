import { useCallback, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AddSaleModal } from '@/components/add-sale-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPendingTasks, getActivityLog, completeTask } from '@/services/taskService';

type Task = ReturnType<typeof getPendingTasks>[number];

const COLORS: Record<string, string> = {
    harvest: '#f47c7c', fertilize: '#3b0a0a', spray: '#0d2f9e',
};
const PAST: Record<string, string> = {
    harvest: 'Harvested', fertilize: 'Fertilized', spray: 'Sprayed',
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function groupByDate(tasks: Task[], dateOf: (t: Task) => Date, todayLabel: string) {
    const today = startOfDay(new Date()).getTime();
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
        const day = startOfDay(dateOf(t)).getTime();
        const key = day <= today && todayLabel === 'Today' ? 'Today'
            : day === today ? 'Today' : fmt(new Date(day));
        map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map].map(([title, data]) => ({ title, data }));
}

export default function TasksScreen() {
    const [saleFor, setSaleFor] = useState<string | null>(null);
    const [tab, setTab] = useState<'tasks' | 'log'>('tasks');
    const [pending, setPending] = useState<Task[]>([]);
    const [log, setLog] = useState<Task[]>([]);

    const load = useCallback(() => {
        setPending(getPendingTasks());
        setLog(getActivityLog());
    }, []);
    useFocusEffect(load);

    const done = (t: Task) => {
        completeTask(t.id);
        load();
        if (t.taskType === 'harvest' && t.cycleId) {
            setSaleFor(t.cycleId);
        }
    };

    const sections = tab === 'tasks'
        ? groupByDate(pending, (t) => t.scheduledDate, 'Today')
        : groupByDate(log, (t) => t.completedDate ?? t.scheduledDate, 'Log');

    const isDue = (t: Task) => startOfDay(t.scheduledDate) <= startOfDay(new Date());

    return (
        <SafeAreaView style={s.container}>
            <View style={s.toggle}>
                {(['tasks', 'log'] as const).map((k) => (
                    <Pressable key={k} style={[s.tab, tab === k && s.tabOn]} onPress={() => setTab(k)}>
                        <Text style={[s.tabText, tab === k && { color: '#fff' }]}>
                            {k === 'tasks' ? 'My Tasks' : 'Activity log'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(t) => t.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={<Text style={{ marginTop: 20 }}>Nothing here yet.</Text>}
                renderSectionHeader={({ section }) => (
                    <Text style={s.header}>{section.title}</Text>
                )}
                renderItem={({ item: t }) => {
                    const dayNo = Math.round(
                        (startOfDay(t.scheduledDate).getTime() - startOfDay(t.plantingDate).getTime()) / 86400000,
                    );
                    return (
                        <View style={s.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.taskTitle}>
                                    <Text style={{ color: COLORS[t.taskType] ?? '#333' }}>
                                        {tab === 'tasks' ? cap(t.taskType) : PAST[t.taskType] ?? cap(t.taskType)}
                                    </Text>{' '}block {t.block}
                                </Text>
                                <Text style={s.sub}>
                                    {t.crop}{tab === 'tasks' ? `, day ${dayNo}` : ''}
                                </Text>
                            </View>
                            {tab === 'tasks' && isDue(t) && (
                                <Pressable style={s.check} onPress={() => done(t)} hitSlop={8} />
                            )}
                        </View>
                    );
                }}
            />
            {saleFor && <AddSaleModal cycleId={saleFor} onClose={() => setSaleFor(null)} />}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    toggle: { flexDirection: 'row', borderWidth: 2, borderColor: '#444', borderRadius: 12, overflow: 'hidden' },
    tab: { flex: 1, padding: 10, alignItems: 'center' },
    tabOn: { backgroundColor: '#4a9a5f' },
    tabText: { fontWeight: '700', fontSize: 16 },
    header: { marginTop: 16, paddingBottom: 4, fontWeight: '700', borderBottomWidth: 2, borderColor: '#4a9a5f', backgroundColor: '#fff' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#888' },
    taskTitle: { fontSize: 18, fontWeight: '600' },
    sub: { color: '#666' },
    check: { width: 30, height: 30, borderWidth: 2, borderColor: '#4a9a5f', borderRadius: 6 },
});