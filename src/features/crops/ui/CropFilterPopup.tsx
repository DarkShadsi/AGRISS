import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Popup } from '../../../shared/components/Popup';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import Dropdown from '../../../shared/components/Dropdown';
import { DEFAULT_FILTER, TYPE_LABELS, type CropFilter, type TypeFilter } from './cropListOptions';

const ALL = '__all__';

type Props = {
    visible: boolean;
    blocks: string[];
    filter: CropFilter;
    onChange: (f: CropFilter) => void;
    onClose: () => void;
};

export default function CropFilterPopup({ visible, blocks, filter, onChange, onClose }: Props) {
    const { height } = useWindowDimensions();

    return (
        <Popup visible={visible} onClose={onClose}>
            <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>Filter crops</AppText>
            <ScrollView style={{ maxHeight: height * 0.6 }} nestedScrollEnabled>
                <AppText weight="semibold" style={{ marginBottom: 8 }}>Type</AppText>
                <View className="gap-2 mb-4">
                    {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
                        <AppButton
                            key={t}
                            title={TYPE_LABELS[t]}
                            variant={filter.type === t ? 'primary' : 'secondary'}
                            onPress={() => onChange({ ...filter, type: t })}
                        />
                    ))}
                </View>

                <AppText weight="semibold" style={{ marginBottom: 8 }}>Block</AppText>
                <Dropdown
                    value={filter.block ?? ALL}
                    options={[{ value: ALL, label: 'All blocks' }, ...blocks.map((b) => ({ value: b, label: `Block ${b}` }))]}
                    onChange={(v) => onChange({ ...filter, block: v === ALL ? null : v })}
                />
            </ScrollView>

            <View className="gap-2" style={{ marginTop: 16 }}>
                <AppButton title="Show all crops" variant="secondary" onPress={() => onChange(DEFAULT_FILTER)} />
                <AppButton title="Done" onPress={onClose} />
            </View>
        </Popup>
    );
}