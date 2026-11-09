import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../core/database/client';
import migrations from '../../drizzle/migrations';
import { seedIfNeeded } from "../features/crops/services/SeedService";

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);
    const [ready, setReady] = useState(false);
    const [seedError, setSeedError] = useState<string | null>(null);

    useEffect(() => {
        if (!success) return;
        try {
            seedIfNeeded();
            setReady(true);
        } catch (e) {
            setSeedError(String(e));
        }
    }, [success]);

    const problem = error?.message ?? seedError;
    if (problem) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', padding: 24}}>
                <Text style={{ fontSize: 18, }}>Database error: {problem}</Text>
            </View>
        );
    }
    if (!ready) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    return <Stack screenOptions={{headerShown: false}} />;

}