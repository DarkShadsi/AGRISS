import { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import AppText from './AppText';
import AppButton from './AppButton';

type PopupProps = { visible: boolean; onClose: () => void; children: ReactNode };

export function Popup({ visible, onClose, children }: PopupProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <Pressable className="flex-1 bg-black/50 items-center justify-center px-5" onPress={onClose}>
                <Pressable className="w-full max-w-[420px] bg-surface rounded-3xl p-5" onPress={() => {}}>
                    {children}
                </Pressable>
            </Pressable>
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