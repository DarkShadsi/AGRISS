import { View, Text, AppState } from 'react-native';
import { TaskService } from '../features/tasks/services/TaskService';
import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../core/database/client';
import migrations from '../../drizzle/migrations';
import { seedIfNeeded } from '../features/crops/services/SeedService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);
    const [fontsLoaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
    const [seeded, setSeeded] = useState(false);
    const [seedError, setSeedError] = useState<string | null>(null);

    useEffect(() => {
        if (!success) return;
        try {
            seedIfNeeded();
            TaskService.runMaintenance();
            setSeeded(true);
        } catch (e) {
            setSeedError(String(e));
        }
    }, [success]);

    useEffect(() => {
        if (!seeded) return;
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                try { TaskService.runMaintenance(); } catch (e) { console.warn(e); }
            }
        });
        return () => sub.remove();
    }, [seeded]);

    useEffect(() => {
        async function hideSystemBars() {
            if (NavigationBar && typeof NavigationBar.setVisibilityAsync === 'function') {
                try {
                    await NavigationBar.setVisibilityAsync("hidden");
                    await NavigationBar.setBehaviorAsync("sticky-immersive");
                } catch (e) {
                    console.log("Navigation bar error:", e);
                }
            }
        }

        hideSystemBars();
    }, []);

    const problem = error?.message ?? seedError;
    const ready = seeded && fontsLoaded;

    useEffect(() => {
        if (ready || problem) SplashScreen.hideAsync();
    }, [ready, problem]);

    if (problem) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
                <Text style={{ fontSize: 18 }}>Database error: {problem}</Text>
            </View>
        );
    }
    if (!ready) return null;
    return <Stack screenOptions={{ headerShown: false }} />;
}