import { View } from 'react-native';
import ScreenContainer from './ScreenContainer';
import AppText from './AppText';

export default function PlaceholderScreen({ title }: { title: string }) {
    return (
        <ScreenContainer>
            <View className="flex-1 items-center justify-center">
                <AppText variant="heading" weight="semibold" tone="primary">{title}</AppText>
            </View>
        </ScreenContainer>
    );
}