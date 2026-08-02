'use client';

import { Alert, Badge, Button, Divider, Group, Paper, Select, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { type CSSProperties, type FormEvent, useEffect, useState, useTransition } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { LINE_DEFINITIONS, type LineId, STATION_NAMES, type StationId } from '@/lib/tokyometro-transfer-search/data';
import {
    formatDistance,
    MAX_OUTSIDE_TRANSFER_COUNT,
    type RouteResult,
    stations,
} from '@/lib/tokyometro-transfer-search/search';
import type { RouteSearchRequest, RouteSearchResponse } from '@/lib/tokyometro-transfer-search/search-worker-protocol';
import styles from './tokyometro-transfer-search-page.module.css';

interface TokyoMetroTransferSearchPageProps {
    initialFrom: StationId | null;
    initialTo: StationId | null;
    initialMaximumOutsideTransferCount: number | null;
    queryError: string | null;
}

const stationOptions = stations.map((station) => ({
    value: station.id,
    label: `${station.name}｜${station.lineIds.map((lineId) => LINE_DEFINITIONS[lineId].name).join('・')}`,
}));

const unspecifiedMaximumOutsideTransferCount = 'unspecified';
const maximumOutsideTransferCountOptions = [
    { value: unspecifiedMaximumOutsideTransferCount, label: '指定しない' },
    ...Array.from({ length: MAX_OUTSIDE_TRANSFER_COUNT }, (_, index) => ({
        value: String(index + 1),
        label: `${index + 1}回`,
    })),
];

const formatYen = (value: number): string => `${value.toLocaleString('ja-JP')}円`;

function LineBadge({ lineId }: { lineId: LineId }) {
    const line = LINE_DEFINITIONS[lineId];
    const lineStyle = { '--line-color': line.color } as CSSProperties;

    return (
        <span className={styles.lineBadge} style={lineStyle}>
            <span className={styles.lineCode}>{line.code}</span>
            {line.name}
        </span>
    );
}

function RouteFlow({ route }: { route: RouteResult }) {
    const firstLeg = route.legs[0];

    return (
        <div className={styles.routeFlow}>
            <div className={styles.stationRow}>
                <span className={styles.stationDot} />
                <Text fw={750}>{STATION_NAMES[firstLeg.fromStationId]}</Text>
            </div>

            {route.legs.map((leg, index) => {
                const transfer = route.transfers[index];
                const lineStyle = { '--line-color': LINE_DEFINITIONS[leg.lineId].color } as CSSProperties;

                return (
                    <div key={`${leg.lineId}:${leg.fromStationId}:${leg.toStationId}`}>
                        <div className={styles.lineSegment} style={lineStyle}>
                            <span className={styles.lineRail} />
                            <div className={styles.lineDetails}>
                                <LineBadge lineId={leg.lineId} />
                            </div>
                        </div>
                        <div className={styles.stationRow}>
                            <span className={styles.stationDot} />
                            <Text fw={750}>{STATION_NAMES[leg.toStationId]}</Text>
                        </div>

                        {transfer != null ? (
                            <div className={styles.transferRow}>
                                <span className={styles.transferMark} />
                                <Group gap="xs" wrap="wrap">
                                    <Badge
                                        radius="xs"
                                        variant="outline"
                                        className={
                                            transfer.type === 'outside' ? styles.outsideTransfer : styles.insideTransfer
                                        }
                                    >
                                        {transfer.type === 'outside' ? '改札外乗換' : '改札内乗換'}
                                    </Badge>
                                    {transfer.fromStationId !== transfer.toStationId ? (
                                        <Text size="sm" c="dimmed">
                                            {STATION_NAMES[transfer.toStationId]}へ
                                        </Text>
                                    ) : null}
                                </Group>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function DebugDetails({ route }: { route: RouteResult }) {
    return (
        <details className={styles.debugDetails}>
            <summary>デバッグ情報</summary>
            <Stack gap={4} mt="xs">
                <Text size="xs" c="dimmed">
                    実走営業キロ: {formatDistance(route.actualDistanceTenths)}
                </Text>
                <Text size="xs" c="dimmed">
                    運賃計算用最短営業キロ: {formatDistance(route.shortestDistanceTenths)}
                </Text>
                {route.fareCheckpoints.map((checkpoint, index) => (
                    <Text key={checkpoint.stationId} size="xs" c="dimmed">
                        改札外乗換 {index + 1}（{STATION_NAMES[checkpoint.stationId]}）:{' '}
                        {formatDistance(checkpoint.shortestDistanceTenths)} / IC {formatYen(checkpoint.fare.ic)} /
                        きっぷ {formatYen(checkpoint.fare.ticket)}
                    </Text>
                ))}
            </Stack>
        </details>
    );
}

function RouteCard({ route, routeNumber }: { route: RouteResult; routeNumber: number }) {
    const transferLabel =
        route.insideTransferCount === 0
            ? `改札外乗換 ${route.outsideTransferCount}回`
            : `改札外乗換 ${route.outsideTransferCount}回 + 改札内乗換 ${route.insideTransferCount}回`;

    return (
        <Paper withBorder radius="sm" className={styles.resultCard}>
            <Group justify="space-between" align="center" gap="md" p="md" className={styles.resultHeader}>
                <Stack gap={6}>
                    <Text className={styles.routeNumber}>ROUTE {String(routeNumber).padStart(3, '0')}</Text>
                    <Badge color="dark" variant="filled" radius="xs" size="lg">
                        {transferLabel}
                    </Badge>
                </Stack>
                <Group gap="xl" className={styles.fareSummary}>
                    <div>
                        <Text size="xs" c="dimmed" fw={700}>
                            IC
                        </Text>
                        <Text size="xl" fw={800} className={styles.fareValue}>
                            {formatYen(route.fare.ic)}
                        </Text>
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" fw={700}>
                            きっぷ
                        </Text>
                        <Text size="xl" fw={800} className={styles.fareValue}>
                            {formatYen(route.fare.ticket)}
                        </Text>
                    </div>
                </Group>
            </Group>
            <Stack gap="md" p="md">
                <RouteFlow route={route} />
                <DebugDetails route={route} />
            </Stack>
        </Paper>
    );
}

export function TokyoMetroTransferSearchPage({
    initialFrom,
    initialTo,
    initialMaximumOutsideTransferCount,
    queryError,
}: TokyoMetroTransferSearchPageProps) {
    const router = useRouter();
    const [fromStationId, setFromStationId] = useState<string | null>(initialFrom);
    const [toStationId, setToStationId] = useState<string | null>(initialTo);
    const [maximumOutsideTransferCount, setMaximumOutsideTransferCount] = useState<number | null>(
        initialMaximumOutsideTransferCount,
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [routes, setRoutes] = useState<RouteResult[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setFromStationId(initialFrom);
        setToStationId(initialTo);
        setMaximumOutsideTransferCount(initialMaximumOutsideTransferCount);
        setFormError(null);
    }, [initialFrom, initialTo, initialMaximumOutsideTransferCount]);

    useEffect(() => {
        if (initialFrom == null || initialTo == null) {
            setRoutes(null);
            setSearchError(null);
            setIsSearching(false);
            return;
        }

        const worker = new Worker(new URL('../../lib/tokyometro-transfer-search/search.worker.ts', import.meta.url), {
            type: 'module',
        });
        const request: RouteSearchRequest = {
            originStationId: initialFrom,
            destinationStationId: initialTo,
            maximumOutsideTransferCount: initialMaximumOutsideTransferCount,
        };

        setRoutes(null);
        setSearchError(null);
        setIsSearching(true);

        worker.onmessage = ({ data }: MessageEvent<RouteSearchResponse>) => {
            if (data.status === 'success') {
                setRoutes(data.routes);
            } else {
                setSearchError(data.message);
            }

            setIsSearching(false);
            worker.terminate();
        };
        worker.onerror = () => {
            setSearchError('経路検索に失敗しました');
            setIsSearching(false);
            worker.terminate();
        };
        worker.postMessage(request);

        return () => {
            worker.terminate();
        };
    }, [initialFrom, initialTo, initialMaximumOutsideTransferCount]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (fromStationId == null || toStationId == null) {
            setFormError('乗車駅と降車駅を指定してください');
            return;
        }

        if (fromStationId === toStationId) {
            setFormError('乗車駅と降車駅には異なる駅を指定してください');
            return;
        }

        setFormError(null);
        const query = new URLSearchParams({ from: fromStationId, to: toStationId });

        if (maximumOutsideTransferCount != null) {
            query.set('maxOutsideTransfers', String(maximumOutsideTransferCount));
        }

        startTransition(() => {
            router.push(`/tools/tokyometro-transfer-search?${query.toString()}`);
        });
    };

    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: '東京メトロ 改札外乗換検索' }]}
            title="東京メトロ 改札外乗換検索"
            description="東京メトロの改札外乗換を最大化するルートを検索する"
            pageSize="xl"
        >
            <Stack gap="xl">
                <Paper component="section" p={{ base: 'md', sm: 'xl' }} radius="sm" className={styles.searchPanel}>
                    <form onSubmit={handleSubmit}>
                        <Stack gap="lg">
                            <div>
                                <Text className={styles.eyebrow}>Search parameters</Text>
                                <Title order={2} size="h3" mt={4}>
                                    乗車区間を指定
                                </Title>
                            </div>
                            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                <Select
                                    label="乗車駅"
                                    placeholder="駅名または路線名で検索"
                                    data={stationOptions}
                                    value={fromStationId}
                                    onChange={setFromStationId}
                                    searchable
                                    clearable
                                    nothingFoundMessage="該当する駅がありません"
                                    comboboxProps={{ withinPortal: false }}
                                />
                                <Select
                                    label="降車駅"
                                    placeholder="駅名または路線名で検索"
                                    data={stationOptions}
                                    value={toStationId}
                                    onChange={setToStationId}
                                    searchable
                                    clearable
                                    nothingFoundMessage="該当する駅がありません"
                                    comboboxProps={{ withinPortal: false }}
                                />
                                <Select
                                    label="最大改札外乗換回数"
                                    data={maximumOutsideTransferCountOptions}
                                    value={
                                        maximumOutsideTransferCount == null
                                            ? unspecifiedMaximumOutsideTransferCount
                                            : String(maximumOutsideTransferCount)
                                    }
                                    onChange={(value) => {
                                        setMaximumOutsideTransferCount(
                                            value == null || value === unspecifiedMaximumOutsideTransferCount
                                                ? null
                                                : Number(value),
                                        );
                                    }}
                                    allowDeselect={false}
                                />
                            </SimpleGrid>
                            <Text size="xs" c="dimmed">
                                最大回数は改札外乗換にのみ適用し、改札内乗換は制限しません。
                            </Text>
                            <Group justify="space-between" align="end" gap="md">
                                <Text size="xs" c="dimmed">
                                    営業キロ・運賃は2026/07/22時点の情報
                                </Text>
                                <Button type="submit" color="dark" loading={isPending || isSearching} px="xl">
                                    検索
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Paper>

                {formError != null || queryError != null || searchError != null ? (
                    <Alert color="red" variant="light" title="入力を確認してください">
                        {formError ?? queryError ?? searchError}
                    </Alert>
                ) : null}

                {isSearching ? (
                    <Paper withBorder p="xl" radius="sm" role="status">
                        <Text ta="center" fw={700}>
                            上位経路を検索しています
                        </Text>
                    </Paper>
                ) : null}

                {routes != null ? (
                    <section aria-labelledby="search-results-title">
                        <Stack gap="lg">
                            <Group justify="space-between" align="end">
                                <div>
                                    <Text className={styles.eyebrow}>Route manifest</Text>
                                    <Title id="search-results-title" order={2} size="h3" mt={4}>
                                        検索結果
                                    </Title>
                                </div>
                                <Text fw={700}>改札外乗換回数の上位 {routes.length.toLocaleString('ja-JP')}件</Text>
                            </Group>
                            <Divider />

                            {routes.length === 0 ? (
                                <Paper withBorder p="xl" radius="sm">
                                    <Text ta="center" fw={700}>
                                        改札外乗換のルートを構成できません
                                    </Text>
                                </Paper>
                            ) : (
                                <Stack gap="lg">
                                    {routes.map((route, index) => (
                                        <RouteCard key={route.key} route={route} routeNumber={index + 1} />
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </section>
                ) : null}
            </Stack>
        </SiteSubpageFrame>
    );
}
