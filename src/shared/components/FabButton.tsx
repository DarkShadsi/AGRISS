import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FabButton({ onPress, label = 'Add' }: { onPress: () => void; label?: string }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            className="absolute right-5 bottom-5 w-16 h-16 rounded-full bg-primary items-center justify-center active:opacity-80"
            style={{ elevation: 6 }}
        >
            <Ionicons name="add" size={40} color="#FFFFFF" />
        </Pressable>
    );
}