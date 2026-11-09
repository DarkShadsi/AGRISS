import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../core/database/client';
import migrations from '../../drizzle/migrations';

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
                <Text style={{ fontSize: 18 }}>Database error: {error.message}</Text>
            </View>
        );
    }
    if (!success) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    return <Stack screenOptions={{ headerShown: false }} />;
}