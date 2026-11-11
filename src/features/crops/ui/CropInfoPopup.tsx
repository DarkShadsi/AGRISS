import { View } from 'react-native';
import { Popup } from '../../../shared/components/Popup';
import AppText from '../../../shared/components/AppText';
import AppButton from '../../../shared/components/AppButton';
import { daysText, formatLongDate } from '../../../shared/utils/dates';
import { ageText } from './CropCard';
import type { CropView } from '../services/CropService';

const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

function harvestText(c: CropView): string {
    if (!c.inCatalog) return 'Not available';
    if (c.harvestInDays === null) return 'Not scheduled';
    if (c.harvestInDays < 0) return `Ready (${plural(-c.harvestInDays)} past)`;
    return daysText(c.harvestInDays);
}

function fertilizeText(c: CropView): string {
    if (!c.inCatalog) return 'Not available';
    if (c.fertilizeInDays === null) return 'None soon';
    if (c.fertilizeInDays < 0) return `Overdue (${plural(-c.fertilizeInDays)})`;
    return daysText(c.fertilizeInDays);
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <AppText tone="muted" style={{ paddingVertical: 3 }}>
            {label}: <AppText weight="semibold" tone="primary">{value}</AppText>
        </AppText>
    );
}

export default function CropInfoPopup({ crop, onClose }: { crop: CropView | null; onClose: () => void }) {
    return (
        <Popup visible={!!crop} onClose={onClose}>
            {crop && (
                <>
                    <AppText variant="heading" weight="bold" tone="primary" style={{ marginBottom: 12 }}>
                        {crop.name}
                    </AppText>
                    <Row label="Block" value={crop.block} />
                    <Row label="Age" value={ageText(crop.ageDays)} />
                    <Row label="Planted on" value={formatLongDate(crop.plantingDate)} />
                    <Row label="Quantity" value={`${crop.quantity} plants`} />
                    <Row label="Harvest unit" value={crop.unit} />
                    <Row label="Harvest in" value={harvestText(crop)} />
                    <Row label="Fertilize in" value={fertilizeText(crop)} />
                    {!crop.inCatalog && (
                        <AppText variant="label" tone="muted" style={{ marginTop: 8 }}>
                            This crop is not in the catalog, so no automatic tasks or harvest estimate are made. You can still add your own tasks.
                        </AppText>
                    )}
                    <View style={{ marginTop: 16 }}>
                        <AppButton title="Close" onPress={onClose} />
                    </View>
                </>
            )}
        </Popup>
    );
}