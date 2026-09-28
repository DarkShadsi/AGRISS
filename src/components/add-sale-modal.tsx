import { useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppModal, formStyles as s } from './app-modal';
import { getCropCards } from '@/services/cropService';
import { addSale } from '@/services/ledgerService';

type Props = { cycleId?: string; onClose: () => void; onSaved?: () => void };

export function AddSaleModal({ cycleId, onClose, onSaved }: Props) {
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
        onSaved?.();
        onClose();
    };

    return (
        <AppModal title="Add Sale" onClose={onClose}>
            <Text style={s.label}>Crop</Text>
            <View style={s.chips}>
                {crops.length === 0 && <Text>Add a crop first.</Text>}
                {crops.map((c) => (
                    <Pressable key={c.id} onPress={() => setSelected(c.id)}
                               style={[s.chip, selected === c.id && s.chipOn]}>
                        <Text style={selected === c.id ? { color: '#fff' } : undefined}>
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
        </AppModal>
    );
}