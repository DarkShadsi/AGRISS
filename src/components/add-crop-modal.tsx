import { useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppModal, formStyles as s } from './app-modal';
import { searchCrops, addCrop } from '@/services/cropService';

type Crop = ReturnType<typeof searchCrops>[number];
type Props = { onClose: () => void; onSaved?: () => void };

export function AddCropModal({ onClose, onSaved }: Props) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Crop | null>(null);
    const [block, setBlock] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const suggestions = selected ? [] : searchCrops(query);

    const save = () => {
        const qty = parseInt(quantity, 10);
        if (!selected || !block.trim() || !qty || qty <= 0) {
            Alert.alert('Missing info', 'Pick a crop and fill in block and quantity.');
            return;
        }
        addCrop({ cropId: selected.id, block: block.trim(), quantity: qty, plantingDate: date });
        onSaved?.();
        onClose();
    };

    return (
        <AppModal title="Add Crop" onClose={onClose}>
            <Text style={s.label}>Crop</Text>
            <TextInput
                style={s.input}
                placeholder="Type a crop name (e.g. Talong)"
                value={query}
                onChangeText={(t) => { setQuery(t); setSelected(null); }}
            />
            {suggestions.map((c) => (
                <Pressable key={c.id} style={s.suggestion}
                           onPress={() => { setSelected(c); setQuery(c.name); }}>
                    <Text>{c.name}{c.filipinoName ? ` (${c.filipinoName})` : ''}</Text>
                </Pressable>
            ))}

            <Text style={s.label}>Block</Text>
            <TextInput style={s.input} value={block} onChangeText={setBlock} />

            <Text style={s.label}>Quantity</Text>
            <TextInput style={s.input} keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />

            <Text style={s.label}>Planting / transplanting date</Text>
            <Pressable style={s.input} onPress={() => setShowPicker(true)}>
                <Text>{date.toDateString()}</Text>
            </Pressable>
            {showPicker && (
                <DateTimePicker value={date} mode="date" onChange={(_, d) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (d) setDate(d);
                }} />
            )}

            <Pressable style={s.button} onPress={save}>
                <Text style={s.buttonText}>Add crop</Text>
            </Pressable>
        </AppModal>
    );
}