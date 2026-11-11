import { View, ScrollView } from 'react-native';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import { COLORS } from '../../../shared/theme';

export default function HomeScreen() {
    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                <View className="bg-surface rounded-2xl border border-line p-4">
                    <AppText variant="label" tone="muted">Good morning</AppText>
                    <AppText variant="display" weight="bold" tone="primary">Rey's farm</AppText>
                </View>

                <AppText variant="heading" weight="semibold">Today's tasks</AppText>
                {[
                    { t: 'Harvest block 3', s: 'Cucumber, day 35', c: COLORS.harvest, g: '●' },
                    { t: 'Fertilize block 2', s: 'Eggplant, day 14', c: COLORS.fertilize, g: '■' },
                    { t: 'Spray block 4', s: 'Corn, day 26', c: COLORS.custom, g: '◆' },
                ].map((x) => (
                    <View key={x.t} className="bg-surface rounded-2xl border border-line p-4 flex-row items-center gap-3">
                        <AppText style={{ color: x.c, fontSize: 28 }}>{x.g}</AppText>
                        <View>
                            <AppText weight="semibold">{x.t}</AppText>
                            <AppText variant="label" tone="muted">{x.s}</AppText>
                        </View>
                    </View>
                ))}

                <AppButton title="Primary button" />
                <AppButton title="Secondary button" variant="secondary" />
                <AppButton title="Delete" variant="danger" />
            </ScrollView>
        </ScreenContainer>
    );
}