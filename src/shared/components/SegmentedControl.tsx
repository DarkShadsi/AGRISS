import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { COLORS } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Option<T extends string> = { value: T; label: string; icon?: IconName };

type Props<T extends string> = {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    compact?: boolean;
};

export default function SegmentedControl<T extends string>({ options, value, onChange, compact }: Props<T>) {
    return (
        <View className="flex-row rounded-2xl border-2 border-primary overflow-hidden">
            {options.map((o) => {
                const selected = o.value === value;
                return (
                    <Pressable
                        key={o.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => onChange(o.value)}
                        className={`flex-1 flex-row items-center justify-center min-h-[52px] ${
                            compact ? 'gap-1 px-1' : 'gap-2 px-2'
                        } ${selected ? 'bg-primary' : 'bg-surface'}`}
                    >
                        {o.icon ? (
                            <Ionicons name={o.icon} size={compact ? 20 : 22} color={selected ? '#FFFFFF' : COLORS.primary} />
                        ) : null}
                        <AppText variant={compact ? 'label' : 'body'} weight="semibold" tone={selected ? 'inverse' : 'primary'}>
                            {o.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}