import { Text, TextProps } from 'react-native';
import { COLORS, FONT, SIZE, TEXT_SCALE } from '../theme';

type Variant = keyof typeof SIZE;
type Weight = keyof typeof FONT;
type Tone = 'ink' | 'muted' | 'primary' | 'danger' | 'inverse';
const TONE: Record<Tone, string> = {
    ink: COLORS.ink, muted: COLORS.muted, primary: COLORS.primary,
    danger: COLORS.danger, inverse: '#FFFFFF',
};

type Props = TextProps & { variant?: Variant; weight?: Weight; tone?: Tone };

export default function AppText({ variant = 'body', weight = 'regular', tone = 'ink', style, ...rest }: Props) {
    const size = SIZE[variant] * TEXT_SCALE;
    return (
        <Text
            allowFontScaling={false}
            style={[{ fontFamily: FONT[weight], fontSize: size, lineHeight: Math.round(size * 1.35), color: TONE[tone] }, style]}
            {...rest}
        />
    );
}