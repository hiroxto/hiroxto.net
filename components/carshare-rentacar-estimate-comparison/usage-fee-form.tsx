import { NumberInput, Radio, Stack, Text } from '@mantine/core';
import { numberInputProps } from '@/components/carshare-rentacar-estimate-comparison/number-input-props';
import type { ComparisonEntry, ComparisonEntryChanges } from '@/components/carshare-rentacar-estimate-comparison/types';

interface UsageFeeFormProps {
    entry: ComparisonEntry;
    onChange: (values: ComparisonEntryChanges) => void;
}

export function UsageFeeForm({ entry, onChange }: UsageFeeFormProps) {
    const { service: serviceId, allDistance } = entry;
    return (
        <>
            <NumberInput
                {...numberInputProps}
                label={serviceId === 'timesCar' ? 'カーシェア利用料金(円)' : 'レンタカー利用料金(円)'}
                description="距離料金・燃料代を除く料金"
                placeholder={serviceId === 'timesCar' ? '例: 5500' : '例: 6072'}
                value={entry.usageFee}
                onChange={(value) => onChange({ usageFee: value })}
            />
            {serviceId === 'timesCar' ? (
                <Radio.Group
                    label="距離料金"
                    value={allDistance ? 'all' : 'after20'}
                    onChange={(value) => onChange({ allDistance: value === 'all' })}
                >
                    <Stack gap="xs" mt="xs">
                        <Radio value="after20" label="通常利用: 20kmを超えた分だけ20円/km" />
                        <Radio value="all" label="ナイトパック等: 利用開始時から20円/km" />
                    </Stack>
                </Radio.Group>
            ) : (
                <Text size="sm" c="dimmed">
                    共通の走行距離・ガソリン単価・燃費から燃料代を加算します。
                </Text>
            )}
        </>
    );
}
