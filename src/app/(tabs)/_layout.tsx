import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT } from '../../shared/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color }: { color: string }) => <Ionicons name={name} size={28} color={color} />;

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#B9D3C6',
                tabBarStyle: { backgroundColor: COLORS.primary, paddingTop: 6 },
                tabBarLabelStyle: { fontFamily: FONT.semibold, fontSize: 16 },
                sceneStyle: { backgroundColor: COLORS.page },
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
            <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: icon('checkbox') }} />
            <Tabs.Screen name="crops" options={{ title: 'Crops', tabBarIcon: icon('leaf') }} />
            <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: icon('bar-chart') }} />
        </Tabs>
    );
}