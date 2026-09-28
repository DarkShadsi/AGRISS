import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AddCropModal } from '@/components/add-crop-modal';  const [adding, setAdding] = useState(false);
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCropCards, deleteCrop } from '@/services/cropService';

type Card = ReturnType<typeof getCropCards>[number];

const inDays = (n: number | null) =>
    n === null ? '—' : n < 0 ? 'overdue' : n === 0 ? 'today' : `${n} day(s)`;

export default function CropsScreen() {
    const [crops, setCrops] = useState<Card[]>([]);
    const [adding, setAdding] = useState(false);

    // Reload every time the tab gains focus (e.g. after adding a crop)
    useFocusEffect(useCallback(() => { setCrops(getCropCards()); }, []));

    const confirmDelete = (c: Card) =>
        Alert.alert('Delete crop', `Remove ${c.name} (block ${c.block}) and its tasks?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => { deleteCrop(c.id); setCrops(getCropCards()); },
            },
        ]);

    return (
        <SafeAreaView style={s.container}>
            <Text style={s.title}>My Crops</Text>
            <FlatList
                data={crops}
                keyExtractor={(c) => c.id}
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ gap: 12, paddingBottom: 90 }}
                ListEmptyComponent={<Text>No crops yet. Tap + to add one.</Text>}
                renderItem={({ item: c }) => (
                    <View style={s.card}>
                        <View style={s.row}>
                            <Text style={s.name}>{c.name}</Text>
                            <Pressable onPress={() => confirmDelete(c)} hitSlop={8}>
                                <Text style={s.menu}>⋮</Text>
                            </Pressable>
                        </View>
                        <Text>Block: {c.block}</Text>
                        <Text>Age: {c.ageDays} day(s) old</Text>
                        <Text>Harvest in: {inDays(c.harvestIn)}</Text>
                        <Text>Fertilize in: {inDays(c.fertilizeIn)}</Text>
                        <Text>Quantity: {c.quantity}</Text>
                    </View>
                )}
            />
            <Pressable style={s.fab} onPress={() => setAdding(true)}>
                <Text style={s.fabText}>+</Text>
            </Pressable>
            {adding && (
                <AddCropModal
                    onClose={() => setAdding(false)}
                    onSaved={() => setCrops(getCropCards())}
                />
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: '700', color: '#1a9a5f', marginBottom: 12 },
    card: { flex: 1, borderWidth: 1.5, borderColor: '#777', borderRadius: 10, padding: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
    menu: { fontSize: 20, fontWeight: '700' },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
        borderRadius: 28, backgroundColor: '#22b573', alignItems: 'center', justifyContent: 'center'
    },
    fabText: { color: '#fff', fontSize: 30 },
});