import { useState } from 'react';
import {
    View, Text, TextInput, Pressable, Platform, StyleSheet, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { searchCrops, addCrop } from '@/services/cropService';
import { db } from '@/db/client';
import { plantingCycles, activeTasks } from '@/db/schema';

type Crop = ReturnType<typeof searchCrops>[number];

export default function AddCropScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Crop | null>(null);
    const [block, setBlock] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const suggestions = selected ? [] : searchCrops(query);

    const pick = (crop: Crop) => {
        setSelected(crop);
        setQuery(crop.name);
    };

    const save = () => {
        const qty = parseInt(quantity, 10);
        if (!selected || !block.trim() || !qty || qty <= 0) {
            Alert.alert('Missing info', 'Pick a crop and fill in block and quantity.');
            return;
        }
        addCrop({
            cropId: selected.id,
            block: block.trim(),
            quantity: qty,
            plantingDate: date,
        });

        //DELETE THIS:
        console.log(db.select().from(plantingCycles).all());
        console.log(db.select().from(activeTasks).all());
        //

        router.back();
    };

    return (
        <View style={s.container}>
            <Text style={s.label}>Crop</Text>
            <TextInput
                style={s.input}
                placeholder="Type a crop name (e.g. Talong)"
                value={query}
                onChangeText={(t) => { setQuery(t); setSelected(null); }}
            />
            {suggestions.map((c) => (
                <Pressable key={c.id} style={s.suggestion} onPress={() => pick(c)}>
                    <Text>{c.name}{c.filipinoName ? ` (${c.filipinoName})` : ''}</Text>
                </Pressable>
            ))}

            <Text style={s.label}>Block</Text>
            <TextInput style={s.input} value={block} onChangeText={setBlock} />

            <Text style={s.label}>Quantity</Text>
            <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={quantity}
                onChangeText={setQuantity}
            />

            <Text style={s.label}>Planting date</Text>
            <Pressable style={s.input} onPress={() => setShowPicker(true)}>
                <Text>{date.toDateString()}</Text>
            </Pressable>
            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    onValueChange={(_, d) => {
                        setShowPicker(Platform.OS === 'ios');
                        if (d) setDate(d);
                    }}
                />
            )}

            <Pressable style={s.button} onPress={save}>
                <Text style={s.buttonText}>Add crop</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    label: { marginTop: 14, marginBottom: 4, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 10 },
    suggestion: { padding: 10, borderBottomWidth: 1, borderColor: '#ddd' },
    button: { marginTop: 24, backgroundColor: '#4a9a5f', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700' },
});