import { Tabs } from 'expo-router';
export default function TabLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="index" options={{ title: 'HOME' }} />
            <Tabs.Screen name="tasks" options={{ title: 'TASKS' }} />
            <Tabs.Screen name="crops" options={{ title: 'CROPS' }} />
            <Tabs.Screen name="analytics" options={{ title: 'ANALYTICS' }} />
        </Tabs>
    );
}