import { ReactNode } from 'react';
import {
    KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';

type Props = { title: string; onClose: () => void; children: ReactNode };

export function AppModal({ title, onClose, children }: Props) {
    return (
        <Modal transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={s.backdrop}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* tapping outside the card closes the popup */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={s.card}>
                    <View style={s.header}>
                        <Text style={s.title}>{title}</Text>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Text style={s.close}>✕</Text>
                        </Pressable>
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 20, fontWeight: '800' },
    close: { fontSize: 20, color: '#666' },
});

// shared by the form popups
export const formStyles = StyleSheet.create({
    label: { marginTop: 14, marginBottom: 4, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 10 },
    suggestion: { padding: 10, borderBottomWidth: 1, borderColor: '#ddd' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#999', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
    chipOn: { backgroundColor: '#4a9a5f', borderColor: '#4a9a5f' },
    total: { marginTop: 16, fontSize: 18, fontWeight: '700' },
    button: { marginTop: 20, backgroundColor: '#4a9a5f', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700' },
});