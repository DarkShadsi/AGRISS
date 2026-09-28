import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Period, getSales, getTotals, deleteSale } from '@/services/ledgerService';

const peso = (n: number) =>
    '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AnalyticsScreen() {
    const [period, setPeriod] = useState<Period>('overall');
    const [sales, setSales] = useState<ReturnType<typeof getSales>>([]);

    const load = useCallback(() => setSales(getSales(period)), [period]);
    useFocusEffect(load);

    const totals = getTotals(sales);

    const confirmDelete = (id: string, name: string | null) =>
        Alert.alert('Delete entry', `Remove this ${name ?? ''} sale?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { deleteSale(id); load(); } },
        ]);

    return (
        <SafeAreaView style={s.container}>
            <View style={s.head}>
                <Text style={s.title}>Analytics</Text>
                <View style={s.toggle}>
                    {(['day', 'month', 'overall'] as const).map((p) => (
                        <Pressable key={p} onPress={() => setPeriod(p)}
                                   style={[s.seg, period === p && s.segOn]}>
                            <Text style={[s.segText, period === p && { color: '#111' }]}>
                                {p[0].toUpperCase() + p.slice(1)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={s.stats}>
                <View style={s.stat}>
                    <Text style={s.statLabel}>Total Yield</Text>
                    <Text style={s.statValue}>{totals.yield} units</Text>
                </View>
                <View style={s.stat}>
                    <Text style={s.statLabel}>Total Income</Text>
                    <Text style={s.statValue}>{peso(totals.income)}</Text>
                </View>
            </View>

            <Text style={s.section}>Sales Ledger</Text>
            <FlatList
                data={sales}
                keyExtractor={(x) => x.id}
                contentContainerStyle={{ gap: 10, paddingBottom: 90 }}
                ListEmptyComponent={<Text>No sales recorded for this period.</Text>}
                renderItem={({ item: x }) => (
                    <Pressable style={s.card} onLongPress={() => confirmDelete(x.id, x.category)}>
                        <Text style={s.cardTitle}>
                            {x.category ?? 'Sale'} – <Text style={s.green}>{peso(x.amount)}</Text>
                        </Text>
                        <View style={s.row}>
                            <Text>Price per unit: <Text style={s.green}>{peso(x.pricePerUnit ?? 0)}</Text></Text>
                            <Text>Units yield: <Text style={s.green}>{x.unitsYield}</Text></Text>
                        </View>
                        <Text>Date: {x.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                    </Pressable>
                )}
            />
            <Link href="/add-sale" style={s.fab}><Text style={s.fabText}>+</Text></Link>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: '800' },
    toggle: { flexDirection: 'row', borderWidth: 2, borderColor: '#444', borderRadius: 12, padding: 2 },
    seg: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
    segOn: { backgroundColor: '#e8e8e8' },
    segText: { color: '#777', fontWeight: '700' },
    stats: { flexDirection: 'row', gap: 12, marginTop: 14 },
    stat: { flex: 1, borderWidth: 2, borderColor: '#777', borderRadius: 10, padding: 10 },
    statLabel: { color: '#1a9a5f', fontWeight: '700', fontSize: 16 },
    statValue: { fontSize: 20, fontWeight: '700', textAlign: 'right' },
    section: { marginVertical: 12, fontWeight: '700', fontSize: 16 },
    card: { borderWidth: 2, borderColor: '#777', borderRadius: 10, padding: 10 },
    cardTitle: { fontSize: 20, fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    green: { color: '#1a9a5f', fontWeight: '700' },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#22b573', textAlign: 'center', lineHeight: 56, overflow: 'hidden',
    },
    fabText: { color: '#fff', fontSize: 30 },
});