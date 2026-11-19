import { useState, type ReactNode } from 'react';
import { MessagePopup } from '../../../shared/components/Popup';
import type { TaskView } from '../services/TaskService';
import TaskFormPopup from './TaskFormPopup';

export function useTaskForm({ onChanged }: { onChanged: () => void }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<{ mode: 'add' | 'edit'; task: TaskView | null }>({ mode: 'add', task: null });
    const [notice, setNotice] = useState<string | null>(null);

    const dialogs: ReactNode = (
        <>
            <TaskFormPopup
                visible={open}
                mode={form.mode}
                task={form.task}
                onClose={() => setOpen(false)}
                onSaved={(message) => { onChanged(); setNotice(message); }}
            />
            <MessagePopup visible={!!notice} message={notice ?? ''} onClose={() => setNotice(null)} />
        </>
    );

    return {
        openAdd: () => { setForm({ mode: 'add', task: null }); setOpen(true); },
        openEdit: (task: TaskView) => { setForm({ mode: 'edit', task }); setOpen(true); },
        dialogs,
    };
}