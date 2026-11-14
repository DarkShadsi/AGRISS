import { useCallback, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import AppText from '../../../shared/components/AppText';
import FabButton from '../../../shared/components/FabButton';
import { MessagePopup, OptionsPopup } from '../../../shared/components/Popup';
import { ConfirmPopup, UndoPopup } from '../../../shared/components/Dialogs';
import { COLORS, FONT, SIZE } from '../../../shared/theme';
import { CropService, type CropView, type DeletedCrop } from '../services/CropService';
import CropCard from './CropCard';
import CropInfoPopup from './CropInfoPopup';
import CropSortFilterBar from './CropSortFilterBar';
import CropFilterPopup from './CropFilterPopup';
import CropFormPopup from './CropFormPopup';
import {
    DEFAULT_FILTER, DEFAULT_SORT, SORT_LABELS, applyView, describeView, naturalCompare,
    type CropFilter, type SortKey,
} from './cropListOptions';

export default function CropsScreen() {
    const [crops, setCrops] = useState<CropView[]>([]);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
    const [filter, setFilter] = useState<CropFilter>(DEFAULT_FILTER);
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
    const [editFor, setEditFor] = useState<CropView | null>(null);
    const [deleteFor, setDeleteFor] = useState<CropView | null>(null);
    const [deleted, setDeleted] = useState<DeletedCrop | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [menuFor, setMenuFor] = useState<CropView | null>(null);
    const [infoFor, setInfoFor] = useState<CropView | null>(null);

    const reload = useCallback(() => setCrops(CropService.getCrops()), []);
    useFocusEffect(reload);

    const visible = applyView(crops, query, sort, filter);
    const blocks = [...new Set(crops.map((c) => c.block))].sort(naturalCompare);
    const filterActive = filter.type !== 'all' || filter.block !== null;

    const confirmDelete = () => {
        if (!deleteFor) return;
        setDeleted(CropService.deleteCrop(deleteFor.id));
        setDeleteFor(null);
        reload();
    };
    const undoDelete = () => {
        if (deleted) CropService.restoreCrop(deleted);
        setDeleted(null);
        reload();
    };
    const closeDeleteMessage = () => setDeleted(null);

    return (
        <ScreenContainer>
            <View className="px-4 pt-3 gap-3">
                <AppText variant="display" weight="bold" tone="primary">My Crops</AppText>
                <View className="flex-row items-center bg-surface border border-line rounded-2xl px-4 min-h-[56px] gap-2">
                    <Ionicons name="search" size={24} color={COLORS.muted} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search crops"
                        placeholderTextColor={COLORS.muted}
                        allowFontScaling={false}
                        style={{ flex: 1, fontFamily: FONT.regular, fontSize: SIZE.body, color: COLORS.ink, paddingVertical: 12 }}
                    />
                </View>
                <CropSortFilterBar
                    summary={describeView(sort, filter)}
                    sortActive={sort !== DEFAULT_SORT}
                    filterActive={filterActive}
                    onSort={() => setSortOpen(true)}
                    onFilter={() => setFilterOpen(true)}
                />
            </View>

            <FlatList
                data={visible}
                keyExtractor={(c) => String(c.id)}
                contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
                renderItem={({ item }) => <CropCard crop={item} onMenu={() => setMenuFor(item)} />}
                ListEmptyComponent={
                    <AppText tone="muted" style={{ textAlign: 'center', marginTop: 32 }}>
                        {crops.length === 0 ? 'No crops yet. Tap + to add your first crop.' : 'No crops match your search or filter.'}
                    </AppText>
                }
            />

            <FabButton label="Add crop" onPress={() => setFormMode('add')} />

            <CropFormPopup
                visible={formMode !== null}
                mode={formMode ?? 'add'}
                crop={editFor}
                onClose={() => setFormMode(null)}
                onSaved={(message) => { reload(); setNotice(message); }}
            />
            <MessagePopup visible={!!notice} message={notice ?? ''} onClose={() => setNotice(null)} />

            <ConfirmPopup
                visible={!!deleteFor}
                title="Delete crop"
                message={deleteFor ? `Are you sure you want to remove ${deleteFor.name} (Block ${deleteFor.block})?` : ''}
                confirmLabel="Delete"
                danger
                onConfirm={confirmDelete}
                onCancel={() => setDeleteFor(null)}
            />
            <UndoPopup
                visible={deleted !== null}
                message="Crop has been deleted successfully!"
                onUndo={undoDelete}
                onOkay={closeDeleteMessage}
            />

            <OptionsPopup
                visible={sortOpen}
                title="Sort crops by"
                onClose={() => setSortOpen(false)}
                options={(Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({
                    label: SORT_LABELS[k],
                    variant: sort === k ? 'primary' : 'secondary',
                    onPress: () => { setSort(k); setSortOpen(false); },
                }))}
            />
            <CropFilterPopup
                visible={filterOpen}
                blocks={blocks}
                filter={filter}
                onChange={setFilter}
                onClose={() => setFilterOpen(false)}
            />

            <OptionsPopup
                visible={!!menuFor}
                title={menuFor?.name}
                onClose={() => setMenuFor(null)}
                options={[
                    { label: 'Info', onPress: () => { setInfoFor(menuFor); setMenuFor(null); } },
                    { label: 'Edit', onPress: () => { setEditFor(menuFor); setFormMode('edit'); setMenuFor(null); } },
                    { label: 'Delete', variant: 'danger', onPress: () => { setDeleteFor(menuFor); setMenuFor(null); } },
                ]}
            />
            <CropInfoPopup crop={infoFor} onClose={() => setInfoFor(null)} />
        </ScreenContainer>
    );
}