import { useCallback, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../core/database/client';
import { crops as cropsTable, tasks as tasksTable } from '../../../core/database/schema';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import FabButton from '../../../shared/components/FabButton';
import { OptionsPopup } from '../../../shared/components/Popup';
import { COLORS, FONT, SIZE } from '../../../shared/theme';
import { addDays, todayString } from '../../../shared/utils/dates';
import { CropService, type CropView } from '../services/CropService';
import CropCard from './CropCard';
import CropInfoPopup from './CropInfoPopup';
import CropSortFilterBar from './CropSortFilterBar';
import CropFilterPopup from './CropFilterPopup';
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
    const [menuFor, setMenuFor] = useState<CropView | null>(null);
    const [infoFor, setInfoFor] = useState<CropView | null>(null);

    const reload = useCallback(() => setCrops(CropService.getCrops()), []);
    useFocusEffect(reload);

    const visible = applyView(crops, query, sort, filter);
    const blocks = [...new Set(crops.map((c) => c.block))].sort(naturalCompare);
    const filterActive = filter.type !== 'all' || filter.block !== null;

    // TEMPORARY test helpers (removed in Part 4.4)
    const addSamples = () => {
        const today = todayString();
        CropService.addCrop({ name: 'Eggplant', block: '2', quantity: '200', plantingDate: addDays(today, -21) });
        CropService.addCrop({ name: 'Tomato', block: '1', quantity: '150', plantingDate: addDays(today, -35) });
        CropService.addCrop({ name: 'Pineapple', block: '3', quantity: '80', plantingDate: addDays(today, -10) });
        reload();
    };
    const clearAll = () => {
        db.delete(tasksTable).run();
        db.delete(cropsTable).run();
        setFilter(DEFAULT_FILTER);
        reload();
    };

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
                <View className="flex-row gap-3">
                    <View style={{ flex: 1 }}><AppButton title="+ Samples" variant="secondary" onPress={addSamples} /></View>
                    <View style={{ flex: 1 }}><AppButton title="Clear all" variant="danger" onPress={clearAll} /></View>
                </View>
                <AppText variant="label" tone="muted">TEMP - next block suggestion: {CropService.suggestNextBlock() || '(empty)'}</AppText>
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

            <FabButton label="Add crop" onPress={() => { /* Part 4.4 */ }} />

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
                    { label: 'Edit', onPress: () => setMenuFor(null) },                       // Part 4.5
                    { label: 'Delete', variant: 'danger', onPress: () => setMenuFor(null) },  // Part 4.5
                ]}
            />
            <CropInfoPopup crop={infoFor} onClose={() => setInfoFor(null)} />
        </ScreenContainer>
    );
}