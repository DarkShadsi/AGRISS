import { useEffect } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@/db/client';
import { activeTasks } from '@/db/schema';
import migrations from '../../drizzle/migrations';
import { seedDatabase } from '@/services/seedService';
import { addCrop } from '../services/cropService';
import seedData from '../assets/data/ph_crops_seed_data.json';

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);

    useEffect(() => {
        if (!success) return; // don't seed until tables actually exist
        seedDatabase(seedData.crops)
            .then(() => {
                console.log(db.select().from(activeTasks).all());
            })
            .catch((e) => console.error('Failed to initialize database:', e));
    }, [success]);

    if (error) {
        return <Text>Migration error: {error.message}</Text>;
    }

    if (!success) {
        return <Text>Setting up database...</Text>;
    }

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-crop" options={{ presentation: 'modal', title: 'Add Crop' }} />
        </Stack>

    );
}