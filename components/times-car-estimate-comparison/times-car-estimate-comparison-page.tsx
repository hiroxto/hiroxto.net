'use client';

import { Anchor, Badge, NumberInput, Paper, Radio, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { compareTimesCarEstimate } from '@/lib/times-car-estimate-comparison/calc';
import type {
    CarShareDistanceChargeMode,
    TimesCarEstimateComparisonInput,
} from '@/lib/times-car-estimate-comparison/types';

type NumberInputValue = string | number;

const currencyFormatter = new Intl.NumberFormat('ja-JP');

const formatYen = (value: number): string => `${currencyFormatter.format(value)}円`;

const parseInputNumber = (value: NumberInputValue): number | null => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (value.trim() === '') {
        return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
};

const buildInput = (
    carShareUsageFeeValue: NumberInputValue,
    rentalCarUsageFeeValue: NumberInputValue,
    distanceKmValue: NumberInputValue,
    gasolinePricePerLiterValue: NumberInputValue,
    fuelEfficiencyKmPerLiterValue: NumberInputValue,
    carShareDistanceChargeMode: CarShareDistanceChargeMode,
): TimesCarEstimateComparisonInput | null => {
    const carShareUsageFee = parseInputNumber(carShareUsageFeeValue);
    const rentalCarUsageFee = parseInputNumber(rentalCarUsageFeeValue);
    const distanceKm = parseInputNumber(distanceKmValue);
    const gasolinePricePerLiter = parseInputNumber(gasolinePricePerLiterValue);
    const fuelEfficiencyKmPerLiter = parseInputNumber(fuelEfficiencyKmPerLiterValue);

    if (
        carShareUsageFee == null ||
        rentalCarUsageFee == null ||
        distanceKm == null ||
        gasolinePricePerLiter == null ||
        fuelEfficiencyKmPerLiter == null ||
        carShareUsageFee < 0 ||
        rentalCarUsageFee < 0 ||
        distanceKm < 0 ||
        gasolinePricePerLiter < 0 ||
        fuelEfficiencyKmPerLiter <= 0
    ) {
        return null;
    }

    return {
        carShareUsageFee,
        rentalCarUsageFee,
        distanceKm,
        gasolinePricePerLiter,
        fuelEfficiencyKmPerLiter,
        carShareDistanceChargeMode,
    };
};

const getComparisonText = (cheaperService: 'carShare' | 'rentalCar' | 'same', difference: number): string => {
    if (cheaperService === 'same') {
        return '同額です';
    }

    const serviceLabel = cheaperService === 'carShare' ? 'カーシェア' : 'レンタカー';

    return `${serviceLabel}のほうが${formatYen(difference)}安いです`;
};

export function TimesCarEstimateComparisonPage() {
    const [carShareUsageFee, setCarShareUsageFee] = useState<NumberInputValue>('');
    const [rentalCarUsageFee, setRentalCarUsageFee] = useState<NumberInputValue>('');
    const [distanceKm, setDistanceKm] = useState<NumberInputValue>('');
    const [gasolinePricePerLiter, setGasolinePricePerLiter] = useState<NumberInputValue>('');
    const [fuelEfficiencyKmPerLiter, setFuelEfficiencyKmPerLiter] = useState<NumberInputValue>('');
    const [carShareDistanceChargeMode, setCarShareDistanceChargeMode] =
        useState<CarShareDistanceChargeMode>('after20km');

    const comparisonResult = useMemo(() => {
        const input = buildInput(
            carShareUsageFee,
            rentalCarUsageFee,
            distanceKm,
            gasolinePricePerLiter,
            fuelEfficiencyKmPerLiter,
            carShareDistanceChargeMode,
        );

        return input == null ? null : compareTimesCarEstimate(input);
    }, [
        carShareUsageFee,
        rentalCarUsageFee,
        distanceKm,
        gasolinePricePerLiter,
        fuelEfficiencyKmPerLiter,
        carShareDistanceChargeMode,
    ]);

    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: 'タイムズカー/タイムズカーレンタル概算比較' }]}
            title="タイムズカー/タイムズカーレンタル概算比較"
            description="タイムズカーとタイムズカーレンタルの料金を入力値から概算比較するページ。"
        >
            <Stack gap="xl">
                <section>
                    <Stack gap="md">
                        <Text>
                            公式料金は
                            <Anchor href="https://share.timescar.jp/fare/use.html" target="_blank" rel="noreferrer">
                                タイムズカーの利用料金
                            </Anchor>
                            と
                            <Anchor href="https://rental.timescar.jp/price/" target="_blank" rel="noreferrer">
                                タイムズカーレンタルの料金と車種
                            </Anchor>
                            を確認する。
                        </Text>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <NumberInput
                                label="カーシェア利用料金(円)"
                                placeholder="例: 5500"
                                value={carShareUsageFee}
                                onChange={setCarShareUsageFee}
                                min={0}
                                allowNegative={false}
                                thousandSeparator=","
                                inputMode="numeric"
                            />
                            <NumberInput
                                label="レンタカー利用料金(円)"
                                placeholder="例: 6072"
                                value={rentalCarUsageFee}
                                onChange={setRentalCarUsageFee}
                                min={0}
                                allowNegative={false}
                                thousandSeparator=","
                                inputMode="numeric"
                            />
                            <NumberInput
                                label="利用距離(km)"
                                placeholder="例: 100"
                                value={distanceKm}
                                onChange={setDistanceKm}
                                min={0}
                                allowNegative={false}
                                thousandSeparator=","
                                decimalScale={1}
                                inputMode="decimal"
                            />
                            <NumberInput
                                label="ガソリン単価(円/L)"
                                placeholder="例: 175"
                                value={gasolinePricePerLiter}
                                onChange={setGasolinePricePerLiter}
                                min={0}
                                allowNegative={false}
                                thousandSeparator=","
                                decimalScale={1}
                                inputMode="decimal"
                            />
                            <NumberInput
                                label="燃費(km/L)"
                                placeholder="例: 15"
                                value={fuelEfficiencyKmPerLiter}
                                onChange={setFuelEfficiencyKmPerLiter}
                                min={0}
                                allowNegative={false}
                                thousandSeparator=","
                                decimalScale={1}
                                inputMode="decimal"
                            />
                        </SimpleGrid>

                        <Radio.Group
                            label="カーシェア距離料金"
                            value={carShareDistanceChargeMode}
                            onChange={(value) => setCarShareDistanceChargeMode(value as CarShareDistanceChargeMode)}
                        >
                            <Stack gap="xs" mt="xs">
                                <Radio value="after20km" label="通常利用: 20kmを超えた分だけ20円/km" />
                                <Radio value="allDistance" label="ナイトパック等: 利用開始時から20円/km" />
                            </Stack>
                        </Radio.Group>
                    </Stack>
                </section>

                {comparisonResult != null ? (
                    <section aria-label="比較結果">
                        <Paper withBorder p="md" radius="sm">
                            <Stack gap="md">
                                <Title order={2} size="h3">
                                    比較結果
                                </Title>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <div>
                                        <Text size="sm" c="dimmed">
                                            カーシェア概算
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {formatYen(comparisonResult.carShareTotal)}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text size="sm" c="dimmed">
                                            レンタカー概算
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {formatYen(comparisonResult.rentalCarTotal)}
                                        </Text>
                                    </div>
                                </SimpleGrid>
                                <Badge size="lg" color={comparisonResult.cheaperService === 'same' ? 'gray' : 'blue'}>
                                    {getComparisonText(comparisonResult.cheaperService, comparisonResult.difference)}
                                </Badge>
                            </Stack>
                        </Paper>
                    </section>
                ) : null}
            </Stack>
        </SiteSubpageFrame>
    );
}
