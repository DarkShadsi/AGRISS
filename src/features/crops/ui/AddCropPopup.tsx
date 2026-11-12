import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Popup } from '../../../shared/components/Popup';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import TextField from '../../../shared/components/TextField';
import DateField from '../../../shared/components/DateField';
import { todayString } from '../../../shared/utils/dates';
import { CropService, type CropErrors } from '../services/CropService';

type Props = { visible: boolean; onClose: () => void; onAdded: () => void };

export default function AddCropPopup({ visible, onClose, onAdded }: Props) {
    const { height } = useWindowDimensions();
    const [name, setName] = useState('');
    const [block, setBlock] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('units');
    const [unitEdited, setUnitEdited] = useState(false);
    const [plantingDate, setPlantingDate] = useState(todayString());
    const [errors, setErrors] = useState<CropErrors>({});

    useEffect(() => {
        if (!visible) return;
        setName('');
        setBlock(CropService.suggestNextBlock());
        setQuantity('');
        setUnit('units');
        setUnitEdited(false);
        setPlantingDate(todayString());
        setErrors({});
    }, [visible]);

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
        else hint = 'Not in the catalog: no automatic tasks will be made. You can still add it.';
    }

    const submit = () => {
        const res = CropService.addCrop({ name, block, quantity, unit, plantingDate });
        if (!res.ok) { setErrors(res.errors); return; }
        onClose();
        onAdded();
    };

    return (
        <Popup visible={visible} onClose={onClose}>
            <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>Add crop</AppText>
            <ScrollView style={{ maxHeight: height * 0.62 }} keyboardShouldPersistTaps="handled">
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
                            <View className="rounded-2xl border border-line bg-surface overflow-hidden">
                                {matches.slice(0, 5).map((c) => (
                                    <Pressable
                                        key={c.id}
                                        accessibilityRole="button"
                                        onPress={() => setName(c.englishName)}
                                        className="min-h-[52px] justify-center px-4 border-b border-line"
                                    >
                                        <AppText weight="semibold">
                                            {c.englishName}
                                            {c.filipinoName ? <AppText tone="muted">{`  (${c.filipinoName})`}</AppText> : null}
                                        </AppText>
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
                    <DateField label="Planting date" value={plantingDate} onChange={setPlantingDate} error={errors.plantingDate} />
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
                <View style={{ flex: 1 }}><AppButton title="Add" onPress={submit} /></View>
            </View>
        </Popup>
    );
}