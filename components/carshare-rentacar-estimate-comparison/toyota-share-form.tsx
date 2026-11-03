import { NumberInput, Select, Text } from '@mantine/core';
import { numberInputProps } from '@/components/carshare-rentacar-estimate-comparison/number-input-props';
import type { ComparisonEntry, ComparisonEntryChanges } from '@/components/carshare-rentacar-estimate-comparison/types';
import type { ToyotaPlan } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

interface ToyotaShareFormProps {
    entry: ComparisonEntry;
    onChange: (values: ComparisonEntryChanges) => void;
}

export function ToyotaShareForm({ entry, onChange }: ToyotaShareFormProps) {
    const { toyotaPlan, toyotaHours } = entry;
    return (
        <>
            <Text size="sm">C1クラス・基本料金の例</Text>
            <Select
                label="料金プラン"
                allowDeselect={false}
                value={toyotaPlan}
                onChange={(value) => {
                    if (value)
                        onChange({
                            toyotaPlan: value as ToyotaPlan,
                        });
                }}
                data={[
                    { value: 'short', label: 'ショート（15分220円）' },
                    { value: '6', label: '6時間パック（5,610円）' },
                    { value: '12', label: '12時間パック（5,940円）' },
                    { value: '24', label: '24時間パック（7,810円）' },
                ]}
            />
            {toyotaPlan === 'short' ? (
                <NumberInput
                    {...numberInputProps}
                    label="利用時間(時間)"
                    description="ショート設定車両・6時間以内。15分単位で切り上げます。"
                    max={6}
                    step={0.25}
                    decimalScale={2}
                    value={toyotaHours}
                    onChange={(value) => onChange({ toyotaHours: value })}
                />
            ) : null}
            <Text size="sm" c="dimmed">
                {toyotaPlan === 'short' ? '距離料金・燃料代込み' : '全走行距離に16円/km（燃料代込み）'}
            </Text>
            <Text size="xs" c="dimmed">
                パックは選んだ時間を使い切る想定です。超過料金・料金の最安組合せ・季節料金・オプションは含みません。
            </Text>
        </>
    );
}
