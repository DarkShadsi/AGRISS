import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { COLORS } from '../theme';

export type DropdownOption = { value: string; label: string };

type Props = {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    maxListHeight?: number;
};

export default function Dropdown({ options, value, onChange, maxListHeight = 240 }: Props) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <View>
            <Pressable
                accessibilityRole="button"
                onPress={() => setOpen((o) => !o)}
                className="flex-row items-center justify-between min-h-[56px] px-4 rounded-2xl border-2 border-primary bg-surface"
            >
                <AppText weight="semibold" tone="primary">{selected?.label ?? ''}</AppText>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.primary} />
            </Pressable>

            {open && (
                <View className="mt-2 rounded-2xl border border-line bg-surface overflow-hidden">
                    <ScrollView style={{ maxHeight: maxListHeight }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {options.map((o) => {
                            const isSelected = o.value === value;
                            return (
                                <Pressable
                                    key={o.value}
                                    accessibilityRole="button"
                                    onPress={() => { onChange(o.value); setOpen(false); }}
                                    className={`flex-row items-center justify-between min-h-[52px] px-4 border-b border-line ${isSelected ? 'bg-primary-soft' : 'bg-surface'}`}
                                >
                                    <AppText weight={isSelected ? 'semibold' : 'regular'}>{o.label}</AppText>
                                    {isSelected && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}