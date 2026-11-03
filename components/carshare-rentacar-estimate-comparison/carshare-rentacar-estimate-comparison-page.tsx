'use client';

import {
    Anchor,
    Badge,
    Button,
    Divider,
    Group,
    NumberInput,
    Paper,
    Radio,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import {
    estimateService,
    type InputValue,
    type ServiceId,
    serviceDetails,
    services,
    type ToyotaPlan,
} from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

const formatYen = (value: number): string => `${new Intl.NumberFormat('ja-JP').format(value)}円`;
const numberProps = {
    min: 0,
    allowNegative: false,
    thousandSeparator: ',',
    radius: 'sm',
    labelProps: { fw: 500 },
} as const;

interface ComparisonEntry {
    id: string;
    service: ServiceId;
    number: number;
    usageFee: InputValue;
    allDistance: boolean;
    toyotaPlan: ToyotaPlan;
    toyotaHours: InputValue;
}

export function CarshareRentacarEstimateComparisonPage() {
    const [selected, setSelected] = useState<ComparisonEntry[]>([]);
    const [distanceKm, setDistanceKm] = useState<InputValue>('');
    const [gasolinePrice, setGasolinePrice] = useState<InputValue>('');
    const [fuelEfficiency, setFuelEfficiency] = useState<InputValue>('');

    const estimates = selected.map((entry) => ({
        entry,
        result: estimateService({ ...entry, distanceKm, gasolinePrice, fuelEfficiency }),
    }));
    const completed = estimates.flatMap(({ result }) => (result ? [result] : []));
    const lowest = completed.length >= 2 ? Math.min(...completed.map(({ total }) => total)) : null;

    function addComparison(service: ServiceId) {
        const id = crypto.randomUUID();
        setSelected((current) => [
            ...current,
            {
                id,
                service,
                number:
                    Math.max(0, ...current.filter((entry) => entry.service === service).map((entry) => entry.number)) +
                    1,
                usageFee: '',
                allDistance: false,
                toyotaPlan: '12',
                toyotaHours: '',
            },
        ]);
    }

    function updateComparison(
        id: string,
        values: Partial<Pick<ComparisonEntry, 'usageFee' | 'allDistance' | 'toyotaPlan' | 'toyotaHours'>>,
    ) {
        setSelected((current) => current.map((entry) => (entry.id === id ? { ...entry, ...values } : entry)));
    }

    return (
        <SiteSubpageFrame
            items={['tools', { label: 'カーシェア・レンタカー概算比較' }]}
            title="カーシェア・レンタカー概算比較"
            description="走行条件をそろえて、選んだサービスの料金を比較できます。"
        >
            <Stack gap="xl">
                <Paper withBorder p="md" radius="sm" component="section" aria-label="共通の走行条件">
                    <Stack gap="md">
                        <Title order={2} size="h3">
                            共通の走行条件
                        </Title>
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <NumberInput
                                {...numberProps}
                                label="走行距離(km)"
                                placeholder="例: 100"
                                decimalScale={1}
                                value={distanceKm}
                                onChange={setDistanceKm}
                            />
                            <NumberInput
                                {...numberProps}
                                label="ガソリン単価(円/L)"
                                placeholder="例: 175"
                                decimalScale={1}
                                value={gasolinePrice}
                                onChange={setGasolinePrice}
                            />
                            <NumberInput
                                {...numberProps}
                                label="燃費(km/L)"
                                placeholder="例: 15"
                                decimalScale={1}
                                value={fuelEfficiency}
                                onChange={setFuelEfficiency}
                            />
                        </SimpleGrid>
                        <Text size="sm" c="dimmed">
                            走行距離は全サービスに共通です。ガソリン単価・燃費は、燃料代を別途支払うレンタカーの計算に使います。
                        </Text>
                    </Stack>
                </Paper>
                <section aria-label="比較するサービス">
                    <Stack gap="md">
                        <Title order={2} size="h3">
                            比較するサービス
                        </Title>
                        <Group>
                            {services.map((service) => (
                                <Button key={service.id} variant="outline" onClick={() => addComparison(service.id)}>
                                    {service.label}を追加
                                </Button>
                            ))}
                        </Group>
                        {selected.length === 0 ? (
                            <Text c="dimmed">
                                比較したいサービスを追加してください。1つだけでも概算を確認できます。
                            </Text>
                        ) : null}
                        <SimpleGrid
                            cols={{
                                base: 1,
                                sm: selected.length === 1 ? 1 : 2,
                                lg: Math.max(1, Math.min(selected.length, 3)),
                            }}
                            spacing="md"
                        >
                            {estimates.map(({ entry, result }) => {
                                const { id, service: serviceId, toyotaPlan, toyotaHours, allDistance } = entry;
                                const service = serviceDetails[serviceId];
                                const label = `${service.label} ${entry.number}`;
                                const isLowest = result !== null && lowest === result.total;
                                return (
                                    <Paper
                                        key={id}
                                        component="section"
                                        aria-label={label}
                                        withBorder
                                        p="md"
                                        radius="sm"
                                        style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}
                                    >
                                        <Stack gap="md" style={{ flex: 1 }}>
                                            <Group justify="space-between" align="start">
                                                <Title order={3} size="h4">
                                                    {label}
                                                </Title>
                                                <Button
                                                    size="compact-xs"
                                                    variant="subtle"
                                                    color="gray"
                                                    aria-label={`${label}を削除`}
                                                    onClick={() =>
                                                        setSelected((current) =>
                                                            current.filter((item) => item.id !== id),
                                                        )
                                                    }
                                                >
                                                    削除
                                                </Button>
                                            </Group>
                                            {service.url ? (
                                                <Anchor href={service.url} target="_blank" rel="noreferrer" size="sm">
                                                    公式料金を確認
                                                </Anchor>
                                            ) : null}
                                            {serviceId === 'toyotaShare' ? (
                                                <>
                                                    <Text size="sm">C1クラス・基本料金の例</Text>
                                                    <Select
                                                        label="料金プラン"
                                                        allowDeselect={false}
                                                        value={toyotaPlan}
                                                        onChange={(value) => {
                                                            if (value)
                                                                updateComparison(id, {
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
                                                            {...numberProps}
                                                            label="利用時間(時間)"
                                                            description="ショート設定車両・6時間以内。15分単位で切り上げます。"
                                                            max={6}
                                                            step={0.25}
                                                            decimalScale={2}
                                                            value={toyotaHours}
                                                            onChange={(value) =>
                                                                updateComparison(id, { toyotaHours: value })
                                                            }
                                                        />
                                                    ) : null}
                                                    <Text size="sm" c="dimmed">
                                                        {toyotaPlan === 'short'
                                                            ? '距離料金・燃料代込み'
                                                            : '全走行距離に16円/km（燃料代込み）'}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        パックは選んだ時間を使い切る想定です。超過料金・料金の最安組合せ・季節料金・オプションは含みません。
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <NumberInput
                                                        {...numberProps}
                                                        label={
                                                            serviceId === 'timesCar'
                                                                ? 'カーシェア利用料金(円)'
                                                                : 'レンタカー利用料金(円)'
                                                        }
                                                        description="距離料金・燃料代を除く料金"
                                                        placeholder={serviceId === 'timesCar' ? '例: 5500' : '例: 6072'}
                                                        value={entry.usageFee}
                                                        onChange={(value) => updateComparison(id, { usageFee: value })}
                                                    />
                                                    {serviceId === 'timesCar' ? (
                                                        <Radio.Group
                                                            label="距離料金"
                                                            value={allDistance ? 'all' : 'after20'}
                                                            onChange={(value) =>
                                                                updateComparison(id, { allDistance: value === 'all' })
                                                            }
                                                        >
                                                            <Stack gap="xs" mt="xs">
                                                                <Radio
                                                                    value="after20"
                                                                    label="通常利用: 20kmを超えた分だけ20円/km"
                                                                />
                                                                <Radio
                                                                    value="all"
                                                                    label="ナイトパック等: 利用開始時から20円/km"
                                                                />
                                                            </Stack>
                                                        </Radio.Group>
                                                    ) : (
                                                        <Text size="sm" c="dimmed">
                                                            共通の走行距離・ガソリン単価・燃費から燃料代を加算します。
                                                        </Text>
                                                    )}
                                                </>
                                            )}
                                            <Stack gap="xs" mt="auto" pt="lg" aria-live="polite">
                                                <Divider />
                                                <Group justify="space-between">
                                                    <Text fw={500}>概算合計</Text>
                                                    {isLowest ? (
                                                        <Badge variant="light">
                                                            入力済みで最安
                                                            {completed.filter((item) => item.total === lowest).length >
                                                            1
                                                                ? '（同額）'
                                                                : ''}
                                                        </Badge>
                                                    ) : null}
                                                </Group>
                                                {result ? (
                                                    <>
                                                        <Text fw={700} size="xl">
                                                            {formatYen(result.total)}
                                                        </Text>
                                                        <Text size="sm" c="dimmed">
                                                            利用料金 {formatYen(result.usageFee)} ＋{' '}
                                                            {serviceId === 'rentalCar' ? '燃料代' : '距離料金'}{' '}
                                                            {formatYen(result.runningCost)}
                                                        </Text>
                                                        {lowest !== null ? (
                                                            <Text size="sm">
                                                                最安との差額 {formatYen(result.total - lowest)}
                                                            </Text>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    <Text c="dimmed">必要な項目を入力すると表示します。</Text>
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </SimpleGrid>
                    </Stack>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
