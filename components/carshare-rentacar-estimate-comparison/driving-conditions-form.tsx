import { NumberInput, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { numberInputProps } from '@/components/carshare-rentacar-estimate-comparison/number-input-props';
import type { InputValue } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

interface DrivingConditionsFormProps {
    distanceKm: InputValue;
    gasolinePrice: InputValue;
    fuelEfficiency: InputValue;
    onDistanceChange: (value: InputValue) => void;
    onGasolinePriceChange: (value: InputValue) => void;
    onFuelEfficiencyChange: (value: InputValue) => void;
}

export function DrivingConditionsForm({
    distanceKm,
    gasolinePrice,
    fuelEfficiency,
    onDistanceChange,
    onGasolinePriceChange,
    onFuelEfficiencyChange,
}: DrivingConditionsFormProps) {
    return (
        <Paper withBorder p="md" radius="sm" component="section" aria-label="共通の走行条件">
            <Stack gap="md">
                <Title order={2} size="h3">
                    共通の走行条件
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <NumberInput
                        {...numberInputProps}
                        label="走行距離(km)"
                        placeholder="例: 100"
                        decimalScale={1}
                        value={distanceKm}
                        onChange={onDistanceChange}
                    />
                    <NumberInput
                        {...numberInputProps}
                        label="ガソリン単価(円/L)"
                        placeholder="例: 175"
                        decimalScale={1}
                        value={gasolinePrice}
                        onChange={onGasolinePriceChange}
                    />
                    <NumberInput
                        {...numberInputProps}
                        label="燃費(km/L)"
                        placeholder="例: 15"
                        decimalScale={1}
                        value={fuelEfficiency}
                        onChange={onFuelEfficiencyChange}
                    />
                </SimpleGrid>
                <Text size="sm" c="dimmed">
                    走行距離は全サービスに共通です。ガソリン単価・燃費は、燃料代を別途支払うレンタカーの計算に使います。
                </Text>
            </Stack>
        </Paper>
    );
}
