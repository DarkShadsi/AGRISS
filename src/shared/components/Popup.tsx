import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import AppButton from './AppButton';

type PopupProps = { visible: boolean; onClose: () => void; children: ReactNode };

export function Popup({ visible, onClose, children }: PopupProps) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View
                    className="flex-1 bg-black/50 items-center justify-center px-5"
                    style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
                >
                    {/* The tap-outside area sits behind the card, so it can close the popup without blocking scrolling. */}
                    <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
                    <View className="w-full max-w-[420px] bg-surface rounded-3xl p-5" style={{ maxHeight: '100%' }}>
                        {children}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export type PopupOption = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' };

type OptionsPopupProps = { visible: boolean; title?: string; options: PopupOption[]; onClose: () => void };

export function OptionsPopup({ visible, title, options, onClose }: OptionsPopupProps) {
    return (
        <Popup visible={visible} onClose={onClose}>
            {title ? (
                <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 16 }}>
                    {title}
                </AppText>
            ) : null}
            <View className="gap-3">
                {options.map((o) => (
                    <AppButton key={o.label} title={o.label} variant={o.variant ?? 'secondary'} onPress={o.onPress} />
                ))}
            </View>
        </Popup>
    );
}

type MessagePopupProps = { visible: boolean; message: string; buttonLabel?: string; onClose: () => void };

export function MessagePopup({ visible, message, buttonLabel = 'Okay', onClose }: MessagePopupProps) {
    return (
        <Popup visible={visible} onClose={onClose}>
            <AppText variant="subheading" weight="semibold" style={{ marginBottom: 16 }}>
                {message}
            </AppText>
            <AppButton title={buttonLabel} onPress={onClose} />
        </Popup>
    );
}