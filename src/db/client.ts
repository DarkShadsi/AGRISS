import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// OPEN OR CREATE THE DATABASE
const expoDb = openDatabaseSync('agriss.db');

// INITIALIZE DRIZZLE WITH THE DATABASE AND SCHEMA
export const db = drizzle(expoDb, { schema });

export type DbClient = typeof db;