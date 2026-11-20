import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Popup } from '../../../shared/components/Popup';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import TextField from '../../../shared/components/TextField';
import DateField from '../../../shared/components/DateField';
import Dropdown from '../../../shared/components/Dropdown';
import { naturalCompare } from '../../../shared/utils/naturalCompare';
import { todayString } from '../../../shared/utils/dates';
import { CropService } from '../../crops/services/CropService';
import { TaskService, type TaskErrors, type TaskView } from '../services/TaskService';

// ============== THE POPUP FORM THAT IS USED WHEN ADDING A NEW TASK OR EDITING ONE ===========

const NONE = '__none__';
const QUICK_PICKS = ['Spray', 'Water', 'Weed', 'Prune'];

type Props = {
    visible: boolean;
    mode: 'add' | 'edit';
    task?: TaskView | null;
    onClose: () => void;
    onSaved: (message: string) => void;
};

export default function TaskFormPopup({ visible, mode, task, onClose, onSaved }: Props) {
    const [title, setTitle] = useState('');
    const [block, setBlock] = useState(NONE);
    const [date, setDate] = useState(todayString());
    const [blocks, setBlocks] = useState<string[]>([]);
    const [errors, setErrors] = useState<TaskErrors>({});

    useEffect(() => {
        if (!visible) return;
        const cropBlocks = [...new Set(CropService.getCrops().map((c) => c.block))].sort(naturalCompare);
        const current = mode === 'edit' && task?.block ? task.block : null;
        setBlocks(current && !cropBlocks.includes(current) ? [...cropBlocks, current].sort(naturalCompare) : cropBlocks);
        if (mode === 'edit' && task) {
            setTitle(task.title);
            setBlock(task.block ?? NONE);
            setDate(task.scheduledDate < todayString() ? todayString() : task.scheduledDate);
        } else {
            setTitle('');
            setBlock(NONE);
            setDate(todayString());
        }
        setErrors({});
    }, [visible, mode, task?.id]);

    const submit = () => {
        const input = { title, block: block === NONE ? null : block, scheduledDate: date };
        if (mode === 'edit' && task) {
            const res = TaskService.updateTask(task.id, input);
            if (!res.ok) { setErrors(res.errors); return; }
            onClose();
            onSaved('Task has been updated successfully!');
        } else {
            const res = TaskService.addTask(input);
            if (!res.ok) { setErrors(res.errors); return; }
            onClose();
            onSaved('Task has been added successfully!');
        }
    };

    return (
        <Popup visible={visible} onClose={onClose}>
            <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>
                {mode === 'edit' ? 'Edit task' : 'Add task'}
            </AppText>
            <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled">
                <View style={{ gap: 14 }}>
                    <TextField
                        label="Task"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="What needs to be done?"
                        error={errors.title}
                        autoCapitalize="sentences"
                    />
                    <View style={{ gap: 6 }}>
                        <AppText variant="label" tone="muted">Quick picks</AppText>
                        <View className="flex-row flex-wrap gap-2">
                            {QUICK_PICKS.map((q) => (
                                <Pressable
                                    key={q}
                                    accessibilityRole="button"
                                    onPress={() => setTitle(q)}
                                    className="min-h-[48px] px-4 rounded-full border-2 border-primary bg-surface items-center justify-center active:bg-primary-soft"
                                >
                                    <AppText weight="semibold" tone="primary">{q}</AppText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={{ gap: 6 }}>
                        <AppText weight="semibold">Block (optional)</AppText>
                        <Dropdown
                            value={block}
                            onChange={setBlock}
                            options={[{ value: NONE, label: 'No block' }, ...blocks.map((b) => ({ value: b, label: `Block ${b}` }))]}
                        />
                    </View>

                    <DateField
                        label="Scheduled date"
                        value={date}
                        onChange={setDate}
                        error={errors.scheduledDate}
                        minDate={todayString()}
                    />
                </View>
            </ScrollView>

            <View className="flex-row gap-3" style={{ marginTop: 16 }}>
                <View style={{ flex: 1 }}><AppButton title="Cancel" variant="secondary" onPress={onClose} /></View>
                <View style={{ flex: 1 }}><AppButton title={mode === 'edit' ? 'Edit' : 'Add'} onPress={submit} /></View>
            </View>
        </Popup>
    );
}