import { View } from 'react-native';
import { Popup } from './Popup';
import AppText from './AppText';
import AppButton from './AppButton';

type ConfirmProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmPopup({
                                 visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, onConfirm, onCancel,
                             }: ConfirmProps) {
    return (
        <Popup visible={visible} onClose={onCancel}>
            <AppText variant="heading" weight="bold" tone={danger ? 'danger' : 'primary'} style={{ marginBottom: 8 }}>
                {title}
            </AppText>
            <AppText style={{ marginBottom: 16 }}>{message}</AppText>
            <View className="flex-row gap-3">
                <View style={{ flex: 1 }}><AppButton title={cancelLabel} variant="secondary" onPress={onCancel} /></View>
                <View style={{ flex: 1 }}>
                    <AppButton title={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} />
                </View>
            </View>
        </Popup>
    );
}

type UndoProps = { visible: boolean; message: string; onUndo: () => void; onOkay: () => void };

/** Success message with Undo. Stays open until the user taps Okay or outside the message. */
export function UndoPopup({ visible, message, onUndo, onOkay }: UndoProps) {
    return (
        <Popup visible={visible} onClose={onOkay}>
            <AppText variant="subheading" weight="semibold" style={{ marginBottom: 8 }}>{message}</AppText>
            <AppText variant="label" tone="muted" style={{ marginBottom: 16 }}>Changed your mind? Tap Undo.</AppText>
            <View className="flex-row gap-3">
                <View style={{ flex: 1 }}><AppButton title="Undo" onPress={onUndo} /></View>
                <View style={{ flex: 1 }}><AppButton title="Okay" variant="secondary" onPress={onOkay} /></View>
            </View>
        </Popup>
    );
}