'use client';

import { Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { ComparisonCard } from '@/components/carshare-rentacar-estimate-comparison/comparison-card';
import { DrivingConditionsForm } from '@/components/carshare-rentacar-estimate-comparison/driving-conditions-form';
import { SavedComparisonActions } from '@/components/carshare-rentacar-estimate-comparison/saved-comparison-actions';
import type { ComparisonEntry, ComparisonEntryChanges } from '@/components/carshare-rentacar-estimate-comparison/types';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import {
    estimateService,
    type InputValue,
    type ServiceId,
    serviceDetails,
    services,
} from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

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

    const hasTiedLowest = completed.filter(({ total }) => total === lowest).length > 1;

    function removeComparison(id: string) {
        setSelected((current) => current.filter((entry) => entry.id !== id));
    }

    function addComparison(service: ServiceId) {
        const id = crypto.randomUUID();
        setSelected((current) => {
            const number =
                Math.max(0, ...current.filter((entry) => entry.service === service).map((entry) => entry.number)) + 1;
            return [
                ...current,
                {
                    id,
                    service,
                    number,
                    label: `${serviceDetails[service].label} ${number}`,
                    usageFee: '',
                    allDistance: false,
                    toyotaPlan: '12',
                    toyotaHours: '',
                },
            ];
        });
    }

    function updateComparison(id: string, values: ComparisonEntryChanges) {
        setSelected((current) => current.map((entry) => (entry.id === id ? { ...entry, ...values } : entry)));
    }

    return (
        <SiteSubpageFrame
            items={['tools', { label: 'カーシェア・レンタカー概算比較' }]}
            title="カーシェア・レンタカー概算比較"
            description="共通の走行条件から各カーシェア・レンタカーの概算料金を比較。"
        >
            <Stack gap="xl">
                <SavedComparisonActions
                    comparison={{ selected, distanceKm, gasolinePrice, fuelEfficiency }}
                    onLoad={(comparison) => {
                        setSelected(comparison.selected);
                        setDistanceKm(comparison.distanceKm);
                        setGasolinePrice(comparison.gasolinePrice);
                        setFuelEfficiency(comparison.fuelEfficiency);
                    }}
                />
                <DrivingConditionsForm
                    distanceKm={distanceKm}
                    gasolinePrice={gasolinePrice}
                    fuelEfficiency={fuelEfficiency}
                    onDistanceChange={setDistanceKm}
                    onGasolinePriceChange={setGasolinePrice}
                    onFuelEfficiencyChange={setFuelEfficiency}
                />
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
                            {estimates.map(({ entry, result }) => (
                                <ComparisonCard
                                    key={entry.id}
                                    entry={entry}
                                    result={result}
                                    lowest={lowest}
                                    hasTiedLowest={hasTiedLowest}
                                    onChange={(values) => updateComparison(entry.id, values)}
                                    onRemove={() => removeComparison(entry.id)}
                                />
                            ))}
                        </SimpleGrid>
                    </Stack>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
