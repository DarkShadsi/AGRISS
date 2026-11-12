import { TextInput, TextInputProps, View } from 'react-native';
import AppText from './AppText';
import { COLORS, FONT, SIZE } from '../theme';

type Props = Omit<TextInputProps, 'style'> & { label: string; error?: string; hint?: string };

export default function TextField({ label, error, hint, ...inputProps }: Props) {
    return (
        <View style={{ gap: 6 }}>
            <AppText weight="semibold">{label}</AppText>
            <TextInput
                allowFontScaling={false}
                placeholderTextColor={COLORS.muted}
                {...inputProps}
                style={{
                    minHeight: 56,
                    borderWidth: 2,
                    borderColor: error ? COLORS.danger : COLORS.line,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontFamily: FONT.regular,
                    fontSize: SIZE.body,
                    color: COLORS.ink,
                    backgroundColor: COLORS.surface,
                }}
            />
            {error ? (
                <AppText variant="label" tone="danger">{error}</AppText>
            ) : hint ? (
                <AppText variant="label" tone="muted">{hint}</AppText>
            ) : null}
        </View>
    );
}