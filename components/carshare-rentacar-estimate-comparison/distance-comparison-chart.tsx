import { LineChart } from '@mantine/charts';
import { Alert, Box, Button, Group, List, NumberInput, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { numberInputProps } from '@/components/carshare-rentacar-estimate-comparison/number-input-props';
import {
    compareDistances,
    type DistanceCandidate,
    type DistancePoint,
    type DistanceRange,
    maximumChartDistanceKm,
    parseDistanceRange,
} from '@/lib/carshare-rentacar-estimate-comparison/distance-comparison';
import type { InputValue } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

const colors = ['#1971c2', '#d9480f', '#087f5b', '#862e9c', '#c2255c', '#5c5f66'];
const distanceLabel = (value: number) => value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
const bandsPerPage = 20;

function FeeLines({
    candidates,
    points,
    range,
    labels,
}: {
    candidates: DistanceCandidate[];
    points: DistancePoint[];
    range: DistanceRange;
    labels: Map<string, string>;
}) {
    const data = points.map((point) => ({
        distanceKm: point.distanceKm,
        ...Object.fromEntries(candidates.map((candidate, index) => [candidate.id, point.totals[index]])),
    }));
    const series = candidates.map((candidate, index) => ({
        name: candidate.id,
        label: labels.get(candidate.id),
        color: colors[index % colors.length],
        strokeDasharray: index >= colors.length ? '7 4' : undefined,
    }));

    return (
        <Box component="figure" aria-label="走行距離別の合計料金" m={0} style={{ minWidth: 0 }}>
            <LineChart
                h={300}
                data={data}
                dataKey="distanceKm"
                series={series}
                curveType="linear"
                withDots={false}
                withLegend
                xAxisLabel="走行距離(km)"
                yAxisLabel="合計料金(円)"
                xAxisProps={{
                    type: 'number',
                    domain: [range.minKm, range.maxKm],
                    allowDataOverflow: true,
                    // 0.1kmだけの範囲では中間目盛りを作らず、両端の値を区別する。
                    ticks: Math.round((range.maxKm - range.minKm) * 10) === 1 ? [range.minKm, range.maxKm] : undefined,
                    tickFormatter: distanceLabel,
                }}
                yAxisProps={{ domain: [0, 'auto'], width: 90 }}
                valueFormatter={(value) => `${value.toLocaleString('ja-JP')}円`}
                tooltipProps={{ labelFormatter: (value) => `${distanceLabel(Number(value))}km` }}
                legendProps={{ wrapperStyle: { maxHeight: 80, overflowY: 'auto' } }}
                styles={{ legendItemName: { overflowWrap: 'anywhere' }, legend: { flexWrap: 'wrap' } }}
            />
            <Text component="figcaption" size="xs" c="dimmed">
                横軸は走行距離(km)、縦軸は合計料金(円)。距離以外の入力条件は固定しています。最安候補と同額帯は下の一覧で確認できます。
            </Text>
        </Box>
    );
}

export function DistanceComparisonChart({
    candidates,
    gasolinePrice,
    fuelEfficiency,
}: {
    candidates: DistanceCandidate[];
    gasolinePrice: InputValue;
    fuelEfficiency: InputValue;
}) {
    const [minKm, setMinKm] = useState<InputValue>(0);
    const [maxKm, setMaxKm] = useState<InputValue>(500);
    const [page, setPage] = useState(1);
    const range = parseDistanceRange(minKm, maxKm);
    const result = useMemo(
        () =>
            compareDistances({
                candidates,
                gasolinePrice,
                fuelEfficiency,
                range: { minKm: Number(minKm), maxKm: Number(maxKm) },
            }),
        [candidates, gasolinePrice, fuelEfficiency, minKm, maxKm],
    );
    const labels = new Map(candidates.map((candidate, index) => [candidate.id, `${index + 1}. ${candidate.label}`]));
    const pageCount = Math.max(1, Math.ceil(result.bands.length / bandsPerPage));
    const activePage = Math.min(page, pageCount);
    const firstBand = (activePage - 1) * bandsPerPage;

    function updateRange(setValue: (value: InputValue) => void, value: InputValue) {
        setValue(value);
        setPage(1);
    }

    return (
        <Paper component="section" aria-label="距離別の料金比較" withBorder p="md" radius="sm" style={{ minWidth: 0 }}>
            <Stack gap="md">
                <Title order={2} size="h3">
                    距離別の料金比較
                </Title>
                <Text size="sm">
                    利用料金・料金プラン・利用時間・ガソリン単価・燃費を固定し、走行距離だけを変えて比較します。共通の走行距離が空欄でも確認できます。
                </Text>
                <SimpleGrid cols={{ base: 1, xs: 2 }}>
                    <NumberInput
                        {...numberInputProps}
                        label="グラフの下限(km)"
                        value={minKm}
                        onChange={(value) => updateRange(setMinKm, value)}
                        max={maximumChartDistanceKm}
                        step={0.1}
                        decimalScale={1}
                        clampBehavior="none"
                    />
                    <NumberInput
                        {...numberInputProps}
                        label="グラフの上限(km)"
                        value={maxKm}
                        onChange={(value) => updateRange(setMaxKm, value)}
                        max={maximumChartDistanceKm}
                        step={0.1}
                        decimalScale={1}
                        clampBehavior="none"
                    />
                </SimpleGrid>
                <Text size="sm" c="dimmed">
                    グラフの範囲: 0〜10,000km、0.1km刻み。上限は下限より大きくしてください。
                </Text>
                {!range ? (
                    <Alert color="red" role="alert">
                        範囲は0〜10,000kmの0.1km刻みで入力し、上限は下限より大きくしてください。
                    </Alert>
                ) : null}
                {result.incompleteCandidateIds.length > 0 ? (
                    <Text size="sm" c="dimmed">
                        未入力または無効な項目がある候補:{' '}
                        {result.incompleteCandidateIds.map((id) => labels.get(id)).join('、')}
                    </Text>
                ) : null}
                {result.candidates.length === 0 ? (
                    <Text c="dimmed">サービスを追加し、走行距離以外の必要な項目を入力してください。</Text>
                ) : null}
                {range && result.points.length > 0 ? (
                    <FeeLines candidates={result.candidates} points={result.points} range={range} labels={labels} />
                ) : null}
                <Title order={3} size="h4">
                    最安候補の切替と同額帯
                </Title>
                <Text size="sm" c="dimmed">
                    範囲内の全ての0.1km地点で、円単位に丸めた料金を比較します。表示する距離は0.1km刻みの確認結果です。連続的な料金曲線の厳密な交点を示すものではありません。グラフの描画点は間引いています。
                </Text>
                {result.candidates.length < 2 ? (
                    <Text size="sm">最安候補の切替を比較するには、入力済みの候補が2つ以上必要です。</Text>
                ) : null}
                {range && result.bands.length > 0 ? (
                    <>
                        {result.bands.length === 1 ? (
                            <Text size="sm">この範囲内では最安候補の切替はありません。</Text>
                        ) : (
                            <Text size="sm">
                                この範囲内の切替は{(result.bands.length - 1).toLocaleString('ja-JP')}件です。
                            </Text>
                        )}
                        <List aria-label="距離ごとの最安候補" spacing="sm" listStyleType="none">
                            {result.bands.slice(firstBand, firstBand + bandsPerPage).map((band, index) => (
                                <List.Item key={band.startKm}>
                                    <Stack gap={2}>
                                        <Text size="sm" fw={600}>
                                            {band.startKm === band.endKm
                                                ? `${distanceLabel(band.startKm)}km`
                                                : `${distanceLabel(band.startKm)}〜${distanceLabel(band.endKm)}km`}
                                        </Text>
                                        <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
                                            {band.candidateIds.length > 1 ? '同額で最安' : '最安'}:{' '}
                                            {band.candidateIds.map((id) => labels.get(id)).join('、')}
                                        </Text>
                                        {firstBand + index > 0 ? (
                                            <Text size="xs" c="dimmed">
                                                切替地点: {distanceLabel(band.startKm)}km
                                            </Text>
                                        ) : null}
                                    </Stack>
                                </List.Item>
                            ))}
                        </List>
                        {pageCount > 1 ? (
                            <Stack gap="xs">
                                <Text size="sm">
                                    {firstBand + 1}〜{Math.min(firstBand + bandsPerPage, result.bands.length)} /{' '}
                                    {result.bands.length.toLocaleString('ja-JP')}区間
                                </Text>
                                <Group>
                                    <Button
                                        variant="default"
                                        size="xs"
                                        disabled={activePage === 1}
                                        onClick={() => setPage(activePage - 1)}
                                    >
                                        前の20区間
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="xs"
                                        disabled={activePage === pageCount}
                                        onClick={() => setPage(activePage + 1)}
                                    >
                                        次の20区間
                                    </Button>
                                </Group>
                            </Stack>
                        ) : null}
                    </>
                ) : null}
            </Stack>
        </Paper>
    );
}
