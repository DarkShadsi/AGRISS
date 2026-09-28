import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Link href="/add-crop">
          <ThemedText type="code">Add crop</ThemedText>
        </Link>
      </ThemedView>
  );
}