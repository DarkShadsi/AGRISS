import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Popup } from '../../../shared/components/Popup';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import TextField from '../../../shared/components/TextField';
import DateField from '../../../shared/components/DateField';
import { COLORS } from '../../../shared/theme';
import { todayString } from '../../../shared/utils/dates';
import { CropService, type CropErrors, type CropView } from '../services/CropService';

type Props = {
    visible: boolean;
    mode: 'add' | 'edit';
    crop?: CropView | null;
    onClose: () => void;
    onSaved: (message: string) => void;
};

export default function CropFormPopup({ visible, mode, crop, onClose, onSaved }: Props) {
    const [name, setName] = useState('');
    const [block, setBlock] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('units');
    const [unitEdited, setUnitEdited] = useState(false);
    const [plantingDate, setPlantingDate] = useState(todayString());
    const [errors, setErrors] = useState<CropErrors>({});

    useEffect(() => {
        if (!visible) return;
        if (mode === 'edit' && crop) {
            setName(crop.name);
            setBlock(crop.block);
            setQuantity(String(crop.quantity));
            setUnit(crop.unit);
            setUnitEdited(true);
            setPlantingDate(crop.plantingDate);
        } else {
            setName('');
            setBlock(CropService.suggestNextBlock());
            setQuantity('');
            setUnit('units');
            setUnitEdited(false);
            setPlantingDate(todayString());
        }
        setErrors({});
    }, [visible, mode, crop?.id]);

    const matches = useMemo(() => (name.trim() ? CropService.suggestCrops(name) : []), [name]);
    const typed = name.trim().toLowerCase();
    const exact = matches.find(
        (c) => c.englishName.toLowerCase() === typed || c.filipinoName?.toLowerCase() === typed
    );

    // Unit follows the catalog crop (or "units") until the user edits it.
    useEffect(() => {
        if (!unitEdited) setUnit(exact?.unit ?? 'units');
    }, [exact?.id, unitEdited]);

    let hint: string | undefined;
    if (typed) {
        if (exact) hint = 'In the catalog: automatic tasks will be made.';
        else if (matches.length > 0) hint = 'Tap a suggestion to use a catalog crop and get automatic tasks.';
        else hint = 'Not in the catalog: no automatic tasks will be made. You can still save it.';
    }

    const submit = () => {
        const input = { name, block, quantity, unit, plantingDate };
        if (mode === 'edit' && crop) {
            const res = CropService.updateCrop(crop.id, input);
            if (!res.ok) { setErrors(res.errors); return; }
            onClose();
            onSaved('Crop has been updated successfully!');
        } else {
            const res = CropService.addCrop(input);
            if (!res.ok) { setErrors(res.errors); return; }
            onClose();
            onSaved('Crop has been added successfully!');
        }
    };

    return (
        <Popup visible={visible} onClose={onClose}>
            <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>
                {mode === 'edit' ? 'Edit crop' : 'Add crop'}
            </AppText>
            <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled">
                <View style={{ gap: 14 }}>
                    <View style={{ gap: 8 }}>
                        <TextField
                            label="Crop"
                            value={name}
                            onChangeText={setName}
                            placeholder="Type a crop name"
                            error={errors.name}
                            hint={hint}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                        {!exact && matches.length > 0 && (
                            <View className="rounded-2xl bg-primary-soft overflow-hidden">
                                <AppText
                                    variant="label"
                                    weight="semibold"
                                    tone="primary"
                                    style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}
                                >
                                    Suggestions: tap one to use it
                                </AppText>
                                {matches.slice(0, 5).map((c) => (
                                    <Pressable
                                        key={c.id}
                                        accessibilityRole="button"
                                        onPress={() => setName(c.englishName)}
                                        className="flex-row items-center gap-3 min-h-[52px] px-4 border-t border-line active:bg-line"
                                    >
                                        <Ionicons name="leaf" size={22} color={COLORS.primary} />
                                        <AppText weight="semibold" style={{ flex: 1 }}>
                                            {c.englishName}
                                            {c.filipinoName ? <AppText tone="muted">{`  (${c.filipinoName})`}</AppText> : null}
                                        </AppText>
                                        <Ionicons name="add-circle" size={26} color={COLORS.primary} />
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    <TextField
                        label="Block"
                        value={block}
                        onChangeText={setBlock}
                        error={errors.block}
                        hint="Each block holds one crop."
                        autoCapitalize="none"
                    />
                    <TextField
                        label="Quantity (plants)"
                        value={quantity}
                        onChangeText={(t) => setQuantity(t.replace(/\D/g, ''))}
                        keyboardType="number-pad"
                        error={errors.quantity}
                    />
                    <DateField label="Planting date" value={plantingDate} onChange={setPlantingDate} error={errors.plantingDate} maxDate={todayString()} />
                    <TextField
                        label="Unit for harvest"
                        value={unit}
                        onChangeText={(t) => { setUnit(t); setUnitEdited(true); }}
                        hint="Used when you log sales, for example kg."
                    />
                </View>
            </ScrollView>

            <View className="flex-row gap-3" style={{ marginTop: 16 }}>
                <View style={{ flex: 1 }}><AppButton title="Cancel" variant="secondary" onPress={onClose} /></View>
                <View style={{ flex: 1 }}><AppButton title={mode === 'edit' ? 'Edit' : 'Add'} onPress={submit} /></View>
            </View>
        </Popup>
    );
}