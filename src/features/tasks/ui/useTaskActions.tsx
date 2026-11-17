import { useState, type ReactNode } from 'react';
import { OptionsPopup, type PopupOption } from '../../../shared/components/Popup';
import { ConfirmPopup, UndoPopup } from '../../../shared/components/Dialogs';
import { TaskService, type TaskUndo, type TaskView } from '../services/TaskService';

type Options = {
    onChanged: () => void;
    onEdit?: (task: TaskView) => void;
};

export function useTaskActions({ onChanged, onEdit }: Options) {
    const [menuFor, setMenuFor] = useState<TaskView | null>(null);
    const [postponeFor, setPostponeFor] = useState<TaskView | null>(null);
    const [deleteFor, setDeleteFor] = useState<TaskView | null>(null);
    const [undo, setUndo] = useState<{ message: string; action: TaskUndo } | null>(null);

    const finish = (message: string, action: TaskUndo | null) => {
        if (action) setUndo({ message, action });
        onChanged();
    };

    const complete = (task: TaskView) => finish('Task marked as complete!', TaskService.completeTask(task.id));

    const confirmPostpone = () => {
        const task = postponeFor;
        setPostponeFor(null);
        if (task) finish('Task has been moved to tomorrow', TaskService.postponeTask(task.id));
    };

    const confirmDelete = () => {
        const task = deleteFor;
        setDeleteFor(null);
        if (task) finish('Task has been deleted successfully!', TaskService.deleteTask(task.id));
    };

    const doUndo = () => {
        if (undo) TaskService.undo(undo.action);
        setUndo(null);
        onChanged();
    };

    const menuOptions: PopupOption[] = [];
    if (menuFor) {
        if (menuFor.canComplete) {
            menuOptions.push({ label: 'Postpone', onPress: () => { setPostponeFor(menuFor); setMenuFor(null); } });
        }
        menuOptions.push({ label: 'Edit', onPress: () => { if (onEdit) onEdit(menuFor); setMenuFor(null); } });
        menuOptions.push({
            label: 'Delete',
            variant: 'danger',
            onPress: () => { setDeleteFor(menuFor); setMenuFor(null); },
        });
    }

    const dialogs: ReactNode = (
        <>
            <OptionsPopup visible={!!menuFor} title={menuFor?.label} options={menuOptions} onClose={() => setMenuFor(null)} />
            <ConfirmPopup
                visible={!!postponeFor}
                title="Postpone task"
                message={postponeFor ? `Are you sure you want to move "${postponeFor.label}" to tomorrow?` : ''}
                confirmLabel="Postpone"
                onConfirm={confirmPostpone}
                onCancel={() => setPostponeFor(null)}
            />
            <ConfirmPopup
                visible={!!deleteFor}
                title="Delete task"
                message={deleteFor ? `Are you sure you want to remove "${deleteFor.label}"?` : ''}
                confirmLabel="Delete"
                danger
                onConfirm={confirmDelete}
                onCancel={() => setDeleteFor(null)}
            />
            <UndoPopup visible={!!undo} message={undo?.message ?? ''} onUndo={doUndo} onOkay={() => setUndo(null)} />
        </>
    );

    return { openMenu: (task: TaskView) => setMenuFor(task), complete, dialogs };
}