import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AppText from './AppText';
import { COLORS } from '../theme';
import { formatLongDate, parseDate, toDateString } from '../utils/dates';

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    minDate?: string;
    maxDate?: string;
};

export default function DateField({ label, value, onChange, error, minDate, maxDate }: Props) {
    const open = () => {
        DateTimePickerAndroid.open({
            value: parseDate(value),
            mode: 'date',
            minimumDate: minDate ? parseDate(minDate) : undefined,
            maximumDate: maxDate ? parseDate(maxDate) : undefined,
            onChange: (event, date) => {
                if (event.type === 'set' && date) onChange(toDateString(date));
            },
        });
    };

    return (
        <View style={{ gap: 6 }}>
            <AppText weight="semibold">{label}</AppText>
            <Pressable
                accessibilityRole="button"
                onPress={open}
                className="flex-row items-center justify-between min-h-[56px] px-4 rounded-2xl bg-surface"
                style={{ borderWidth: 2, borderColor: error ? COLORS.danger : COLORS.line }}
            >
                <AppText>{formatLongDate(value)}</AppText>
                <Ionicons name="calendar-outline" size={26} color={COLORS.primary} />
            </Pressable>
            {error ? <AppText variant="label" tone="danger">{error}</AppText> : null}
        </View>
    );
}