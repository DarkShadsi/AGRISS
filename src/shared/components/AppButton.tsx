import { Pressable, PressableProps } from 'react-native';
import AppText from './AppText';

type Props = PressableProps & { title: string; variant?: 'primary' | 'secondary' | 'danger' };
const BG = {
    primary: 'bg-primary',
    secondary: 'bg-surface border-2 border-primary',
    danger: 'bg-danger',
};

export default function AppButton({ title, variant = 'primary', ...rest }: Props) {
    return (
        <Pressable
            accessibilityRole="button"
            className={`min-h-[56px] px-6 rounded-2xl items-center justify-center active:opacity-80 ${BG[variant]}`}
            {...rest}
        >
            <AppText variant="subheading" weight="semibold" tone={variant === 'secondary' ? 'primary' : 'inverse'}>
                {title}
            </AppText>
        </Pressable>
    );
}