import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text } from 'react-native';
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
        try { seedIfNeeded(); setSeeded(true); } catch (e) { setSeedError(String(e)); }
    }, [success]);

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