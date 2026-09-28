import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCropCards } from '@/services/cropService';
import { addSale } from '@/services/ledgerService';

export default function AddSaleScreen() {
    const router = useRouter();
    const { cycleId } = useLocalSearchParams<{ cycleId?: string }>();
    const [crops] = useState(() => getCropCards());
    const [selected, setSelected] = useState(cycleId ?? '');
    const [units, setUnits] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const total = (parseFloat(units) || 0) * (parseFloat(price) || 0);

    const save = () => {
        const crop = crops.find((c) => c.id === selected);
        const u = parseFloat(units), p = parseFloat(price);
        if (!crop || !(u > 0) || !(p >= 0)) {
            Alert.alert('Missing info', 'Pick a crop, then enter units and price per unit.');
            return;
        }
        addSale({ cycleId: crop.id, cropName: crop.name, unitsYield: u, pricePerUnit: p, date });
        router.canGoBack() ? router.back() : router.replace('/');
    };

    return (
        <View style={s.container}>
            <Text style={s.label}>Crop</Text>
            <View style={s.chips}>
                {crops.length === 0 && <Text>Add a crop first.</Text>}
                {crops.map((c) => (
                    <Pressable key={c.id} onPress={() => setSelected(c.id)}
                               style={[s.chip, selected === c.id && s.chipOn]}>
                        <Text style={selected === c.id && { color: '#fff' }}>
                            {c.name} (block {c.block})
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Text style={s.label}>Units yield</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={units} onChangeText={setUnits} />

            <Text style={s.label}>Price per unit (₱)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />

            <Text style={s.label}>Date</Text>
            <Pressable style={s.input} onPress={() => setShowPicker(true)}>
                <Text>{date.toDateString()}</Text>
            </Pressable>
            {showPicker && (
                <DateTimePicker value={date} mode="date" onChange={(_, d) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (d) setDate(d);
                }} />
            )}

            <Text style={s.total}>Total: ₱{total.toFixed(2)}</Text>
            <Pressable style={s.button} onPress={save}>
                <Text style={s.buttonText}>Save sale</Text>
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    label: { marginTop: 14, marginBottom: 4, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#999', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
    chipOn: { backgroundColor: '#4a9a5f', borderColor: '#4a9a5f' },
    total: { marginTop: 16, fontSize: 18, fontWeight: '700' },
    button: { marginTop: 16, backgroundColor: '#4a9a5f', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700' },
});