import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Popup } from './Popup';
import AppText from './AppText';
import AppButton from './AppButton';
import { UNDO_DURATION_MS } from '../theme';

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

/** Success message with Undo. Closes by itself after the Undo time; tapping outside does nothing. */
export function UndoPopup({ visible, message, onUndo, onOkay }: UndoProps) {
    const total = Math.round(UNDO_DURATION_MS / 1000);
    const [left, setLeft] = useState(total);
    const onOkayRef = useRef(onOkay);
    onOkayRef.current = onOkay;

    useEffect(() => {
        if (!visible) return;
        setLeft(total);
        const id = setInterval(() => setLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [visible, total]);

    useEffect(() => {
        if (visible && left === 0) onOkayRef.current();
    }, [visible, left]);

    return (
        <Popup visible={visible} onClose={() => {}}>
            <AppText variant="subheading" weight="semibold" style={{ marginBottom: 8 }}>{message}</AppText>
            <AppText variant="label" tone="muted" style={{ marginBottom: 16 }}>
                You can undo this for {Math.max(left, 0)} second{left === 1 ? '' : 's'}.
            </AppText>
            <View className="flex-row gap-3">
                <View style={{ flex: 1 }}><AppButton title="Undo" onPress={onUndo} /></View>
                <View style={{ flex: 1 }}><AppButton title="Okay" variant="secondary" onPress={onOkay} /></View>
            </View>
        </Popup>
    );
}