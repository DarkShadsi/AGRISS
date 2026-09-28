import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPendingTasks, getUpcomingHarvests, completeTask } from '@/services/taskService';

type Task = ReturnType<typeof getPendingTasks>[number];

const COLORS: Record<string, string> = {
    harvest: '#f47c7c', fertilize: '#3b0a0a', spray: '#0d2f9e',
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysBetween = (a: Date, b: Date) =>
    Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);

const harvestLabel = (n: number) =>
    n < 0 ? 'Overdue' : n === 0 ? 'Harvest today' : n === 1 ? 'Harvest tomorrow' : `Harvest in ${n} days`;

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
    const router = useRouter();
    const [today, setToday] = useState<Task[]>([]);
    const [harvests, setHarvests] = useState<Task[]>([]);

    const load = useCallback(() => {
        const now = new Date();
        setToday(getPendingTasks().filter((t) => daysBetween(t.scheduledDate, now) <= 0));
        setHarvests(getUpcomingHarvests());
    }, []);
    useFocusEffect(load);

    const done = (t: Task) => {
        completeTask(t.id);
        load();
        if (t.taskType === 'harvest' && t.cycleId) {
            router.push({ pathname: '/add-sale', params: { cycleId: t.cycleId } });
        }
    };

    return (
        <SafeAreaView style={s.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={s.banner}>
                    <View>
                        <Text style={s.greet}>{greeting()}</Text>
                        <Text style={s.farm}>My Farm</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.date}>
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Text>
                        <Link href="/add-crop" style={s.plus}>+</Link>
                    </View>
                </View>

                <Text style={s.section}>Today's tasks</Text>
                {today.length === 0 && <Text style={s.empty}>No tasks due today.</Text>}
                {today.map((t) => (
                    <View key={t.id} style={s.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.taskTitle}>
                                <Text style={{ color: COLORS[t.taskType] ?? '#333' }}>{cap(t.taskType)}</Text>{' '}
                                block {t.block}
                            </Text>
                            <Text style={s.sub}>
                                {t.crop}, day {daysBetween(t.scheduledDate, t.plantingDate)}
                            </Text>
                        </View>
                        <Pressable style={s.check} onPress={() => done(t)} hitSlop={8} />
                    </View>
                ))}

                <Text style={s.section}>Upcoming harvests</Text>
                {harvests.length === 0 && <Text style={s.empty}>No upcoming harvests.</Text>}
                {harvests.map((t) => (
                    <View key={t.id} style={s.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.taskTitle}>
                                {t.crop} <Text style={s.sub}>(block {t.block})</Text>
                            </Text>
                            <Text style={s.harvest}>
                                {harvestLabel(daysBetween(t.scheduledDate, new Date()))}
                            </Text>
                        </View>
                        <Text style={s.sub}>{daysBetween(new Date(), t.plantingDate)} days old</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    banner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 2, borderColor: '#4a9a5f', borderRadius: 16, padding: 14,
    },
    greet: { color: '#666', fontWeight: '600', fontSize: 16 },
    farm: { fontSize: 26, fontWeight: '800' },
    date: { fontWeight: '600' },
    plus: { marginTop: 6, fontSize: 24, color: '#4a9a5f', fontWeight: '700' },
    section: { marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: '700', color: '#444' },
    empty: { color: '#777' },
    card: {
        flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8,
        borderWidth: 1.5, borderColor: '#777', borderRadius: 10,
    },
    taskTitle: { fontSize: 18, fontWeight: '700' },
    sub: { color: '#666', fontWeight: '400' },
    harvest: { color: '#1a9a5f', fontWeight: '600' },
    check: { width: 30, height: 30, borderWidth: 2, borderColor: '#4a9a5f', borderRadius: 6 },
});