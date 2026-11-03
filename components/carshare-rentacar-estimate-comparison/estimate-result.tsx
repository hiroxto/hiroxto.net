import { Badge, Divider, Group, Stack, Text } from '@mantine/core';
import type { estimateService, ServiceId } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

const formatYen = (value: number): string => `${new Intl.NumberFormat('ja-JP').format(value)}円`;

interface EstimateResultProps {
    serviceId: ServiceId;
    result: ReturnType<typeof estimateService>;
    lowest: number | null;
    hasTiedLowest: boolean;
}

export function EstimateResult({ serviceId, result, lowest, hasTiedLowest }: EstimateResultProps) {
    const isLowest = result !== null && lowest === result.total;
    return (
        <Stack gap="xs" mt="auto" pt="lg" aria-live="polite">
            <Divider />
            <Group justify="space-between">
                <Text fw={500}>概算合計</Text>
                {isLowest ? (
                    <Badge variant="light">
                        入力済みで最安
                        {hasTiedLowest ? '（同額）' : ''}
                    </Badge>
                ) : null}
            </Group>
            {result ? (
                <>
                    <Text fw={700} size="xl">
                        {formatYen(result.total)}
                    </Text>
                    <Text size="sm" c="dimmed">
                        利用料金 {formatYen(result.usageFee)} ＋ {serviceId === 'rentalCar' ? '燃料代' : '距離料金'}{' '}
                        {formatYen(result.runningCost)}
                    </Text>
                    {lowest !== null ? <Text size="sm">最安との差額 {formatYen(result.total - lowest)}</Text> : null}
                </>
            ) : (
                <Text c="dimmed">必要な項目を入力すると表示します。</Text>
            )}
        </Stack>
    );
}
