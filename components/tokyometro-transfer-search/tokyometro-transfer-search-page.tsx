'use client';

import {
    Accordion,
    Alert,
    Badge,
    Button,
    Checkbox,
    Divider,
    Group,
    NumberInput,
    type OptionsFilter,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    Title,
} from '@mantine/core';
import { ArrowsLeftRightIcon } from '@phosphor-icons/react/dist/csr/ArrowsLeftRight';
import { useRouter } from 'next/navigation';
import { type CSSProperties, type FormEvent, useEffect, useState, useTransition } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import {
    LINE_DEFINITIONS,
    type LineId,
    STATION_NAMES,
    STATION_READINGS,
    type StationId,
} from '@/lib/tokyometro-transfer-search/data';
import {
    allOutsideTransferIds,
    emptyOutsideTransfersMessage,
    outsideTransferOptions,
} from '@/lib/tokyometro-transfer-search/outside-transfers';
import {
    formatDistance,
    invalidResultLimitMessage,
    isValidResultLimit,
    MAX_OUTSIDE_TRANSFER_COUNT,
    type RouteResult,
    SEARCH_RESULT_LIMIT,
    stations,
} from '@/lib/tokyometro-transfer-search/search';
import { parseResultLimitInput } from '@/lib/tokyometro-transfer-search/search-params';
import type { RouteSearchRequest, RouteSearchResponse } from '@/lib/tokyometro-transfer-search/search-worker-protocol';
import styles from './tokyometro-transfer-search-page.module.css';

interface TokyoMetroTransferSearchPageProps {
    initialFrom: StationId | null;
    initialTo: StationId | null;
    initialMaximumOutsideTransferCount: number | null;
    initialResultLimit?: number;
    initialIncludeInsideTransfers: boolean;
    initialOutsideTransferIds: StationId[];
    queryError: string | null;
}

const stationOptions = stations.map((station) => ({
    value: station.id,
    reading: STATION_READINGS[station.id],
    label: `${station.name}｜${station.lineIds.map((lineId) => LINE_DEFINITIONS[lineId].name).join('・')}`,
}));

function filterStationOptions({ search, limit }: Parameters<OptionsFilter>[0]) {
    const query = search.trim().toLowerCase();
    return stationOptions
        .filter((option) => option.label.toLowerCase().includes(query) || option.reading.includes(query))
        .slice(0, limit);
}

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
                            <Group gap="xs" wrap="wrap">
                                <Text fw={750}>
                                    {STATION_NAMES[leg.toStationId]}
                                    {transfer != null && transfer.fromStationId !== transfer.toStationId
                                        ? ` / ${STATION_NAMES[transfer.toStationId]}`
                                        : ''}
                                </Text>
                                {transfer != null ? (
                                    <Badge
                                        radius="xs"
                                        variant="outline"
                                        className={
                                            transfer.type === 'outside' ? styles.outsideTransfer : styles.insideTransfer
                                        }
                                    >
                                        {transfer.type === 'outside' ? '改札外乗換' : '改札内乗換'}
                                    </Badge>
                                ) : null}
                            </Group>
                        </div>
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
                    <Text className={styles.routeNumber}>経路 {String(routeNumber).padStart(3, '0')}</Text>
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
    initialIncludeInsideTransfers,
    initialOutsideTransferIds,
    initialResultLimit = SEARCH_RESULT_LIMIT,
    queryError,
}: TokyoMetroTransferSearchPageProps) {
    const router = useRouter();
    const [fromStationId, setFromStationId] = useState<string | null>(initialFrom);
    const [toStationId, setToStationId] = useState<string | null>(initialTo);
    const [maximumOutsideTransferCount, setMaximumOutsideTransferCount] = useState<number | null>(
        initialMaximumOutsideTransferCount,
    );
    const [outsideTransferIds, setOutsideTransferIds] = useState(initialOutsideTransferIds);
    const [resultLimitInput, setResultLimitInput] = useState(String(initialResultLimit));
    const [resultLimitError, setResultLimitError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [includeInsideTransfers, setIncludeInsideTransfers] = useState(initialIncludeInsideTransfers);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [routes, setRoutes] = useState<RouteResult[] | null>(null);
    const [isSearchTruncated, setIsSearchTruncated] = useState(false);
    const [outsideTransferUpperBound, setOutsideTransferUpperBound] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [searchAttempt, setSearchAttempt] = useState(0);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setResultLimitInput(String(initialResultLimit));
        setResultLimitError(null);
        setFromStationId(initialFrom);
        setToStationId(initialTo);
        setMaximumOutsideTransferCount(initialMaximumOutsideTransferCount);
        setIncludeInsideTransfers(initialIncludeInsideTransfers);
        setOutsideTransferIds(initialOutsideTransferIds);
        setFormError(null);
    }, [
        initialResultLimit,
        initialFrom,
        initialTo,
        initialMaximumOutsideTransferCount,
        initialIncludeInsideTransfers,
        initialOutsideTransferIds,
    ]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: 同一条件の送信でもWorkerを再起動する。
    useEffect(() => {
        if (initialFrom == null || initialTo == null) {
            setRoutes(null);
            setIsSearchTruncated(false);
            setSearchError(null);
            setIsSearching(false);
            return;
        }

        const worker = new Worker(new URL('../../lib/tokyometro-transfer-search/search.worker.ts', import.meta.url), {
            type: 'module',
        });
        const request: RouteSearchRequest = {
            resultLimit: initialResultLimit,
            originStationId: initialFrom,
            destinationStationId: initialTo,
            maximumOutsideTransferCount: initialMaximumOutsideTransferCount,
            includeInsideTransfers: initialIncludeInsideTransfers,
            outsideTransferIds: initialOutsideTransferIds,
        };

        setRoutes(null);
        setIsSearchTruncated(false);
        setSearchError(null);
        setIsSearching(true);

        worker.onmessage = ({ data }: MessageEvent<RouteSearchResponse>) => {
            if (data.status === 'success') {
                setRoutes(data.routes);
                setIsSearchTruncated(data.truncated);
                setOutsideTransferUpperBound(data.outsideTransferUpperBound);
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
    }, [
        initialResultLimit,
        initialFrom,
        initialTo,
        initialMaximumOutsideTransferCount,
        initialIncludeInsideTransfers,
        initialOutsideTransferIds,
        searchAttempt,
    ]);

    const areAllOutsideTransfersSelected = outsideTransferIds.length === allOutsideTransferIds.length;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const resultLimit = parseResultLimitInput(resultLimitInput);
        if (!isValidResultLimit(resultLimit)) {
            setResultLimitError(invalidResultLimitMessage);
            return;
        }
        setResultLimitError(null);

        if (fromStationId == null || toStationId == null) {
            setFormError('乗車駅と降車駅を指定してください');
            return;
        }

        if (fromStationId === toStationId) {
            setFormError('乗車駅と降車駅には異なる駅を指定してください');
            return;
        }

        if (outsideTransferIds.length === 0) {
            setFormError(emptyOutsideTransfersMessage);
            return;
        }

        setFormError(null);
        if (
            resultLimit === initialResultLimit &&
            fromStationId === initialFrom &&
            toStationId === initialTo &&
            maximumOutsideTransferCount === initialMaximumOutsideTransferCount &&
            includeInsideTransfers === initialIncludeInsideTransfers &&
            outsideTransferIds.length === initialOutsideTransferIds.length &&
            outsideTransferIds.every((id) => initialOutsideTransferIds.includes(id))
        ) {
            setSearchAttempt((attempt) => attempt + 1);
            return;
        }

        const query = new URLSearchParams({ from: fromStationId, to: toStationId });

        if (resultLimit !== SEARCH_RESULT_LIMIT) {
            query.set('resultLimit', String(resultLimit));
        }

        if (maximumOutsideTransferCount != null) {
            query.set('maxOutsideTransfers', String(maximumOutsideTransferCount));
        }

        if (!includeInsideTransfers) {
            query.set('includeInsideTransfers', 'false');
        }

        if (outsideTransferIds.length !== allOutsideTransferIds.length) {
            query.set(
                'outsideTransfers',
                allOutsideTransferIds.filter((id) => outsideTransferIds.includes(id)).join(','),
            );
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
                                <Title order={2} size="h3">
                                    乗車区間を指定
                                </Title>
                            </div>
                            <div className={styles.searchFields}>
                                <Select
                                    comboboxProps={{ radius: 'sm' }}
                                    styles={{ option: { borderRadius: 'var(--mantine-radius-sm)' } }}
                                    labelProps={{ fw: 500 }}
                                    radius="sm"
                                    label="乗車駅"
                                    placeholder="駅名または路線名で検索"
                                    data={stationOptions}
                                    filter={filterStationOptions}
                                    value={fromStationId}
                                    onChange={setFromStationId}
                                    searchable
                                    clearable
                                    clearButtonProps={{ style: { borderRadius: 'var(--mantine-radius-sm)' } }}
                                    nothingFoundMessage="該当する駅がありません"
                                />
                                <Button
                                    className={styles.reverseButton}
                                    aria-label="発着逆転"
                                    radius="sm"
                                    type="button"
                                    variant="default"
                                    leftSection={
                                        <ArrowsLeftRightIcon
                                            className={styles.reverseIcon}
                                            size={18}
                                            aria-hidden="true"
                                            focusable="false"
                                        />
                                    }
                                    onClick={() => {
                                        setFromStationId(toStationId);
                                        setToStationId(fromStationId);
                                    }}
                                >
                                    発着逆転
                                </Button>
                                <Select
                                    comboboxProps={{ radius: 'sm' }}
                                    styles={{ option: { borderRadius: 'var(--mantine-radius-sm)' } }}
                                    labelProps={{ fw: 500 }}
                                    radius="sm"
                                    label="降車駅"
                                    placeholder="駅名または路線名で検索"
                                    data={stationOptions}
                                    filter={filterStationOptions}
                                    value={toStationId}
                                    onChange={setToStationId}
                                    searchable
                                    clearable
                                    clearButtonProps={{ style: { borderRadius: 'var(--mantine-radius-sm)' } }}
                                    nothingFoundMessage="該当する駅がありません"
                                />
                                <Select
                                    comboboxProps={{ radius: 'sm' }}
                                    styles={{ option: { borderRadius: 'var(--mantine-radius-sm)' } }}
                                    labelProps={{ fw: 500 }}
                                    radius="sm"
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
                            </div>
                            <Text size="xs" c="dimmed">
                                最大回数は改札外乗換にのみ適用します。改札内乗換を含める場合、その回数は制限しません。
                            </Text>
                            <Switch
                                label="改札内乗換を含める"
                                checked={includeInsideTransfers}
                                onChange={(event) => setIncludeInsideTransfers(event.currentTarget.checked)}
                            />
                            <Accordion variant="contained" radius="sm">
                                <Accordion.Item value="details">
                                    <Accordion.Control>詳細指定</Accordion.Control>
                                    <Accordion.Panel>
                                        <NumberInput
                                            label="取得件数"
                                            description="未設定の場合は20件取得します。"
                                            placeholder="20"
                                            min={1}
                                            clampBehavior="none"
                                            trimLeadingZeroesOnBlur={false}
                                            radius="sm"
                                            mb="md"
                                            value={resultLimitInput}
                                            onValueChange={({ value }) => setResultLimitInput(value)}
                                            error={resultLimitError}
                                        />
                                        <Checkbox.Group
                                            label="利用する改札外乗換駅"
                                            description="利用する駅を1つ以上選択してください。選択を外しても通過や改札内乗換は制限しません。"
                                            value={outsideTransferIds}
                                            onChange={(values) =>
                                                setOutsideTransferIds(
                                                    allOutsideTransferIds.filter((id) => values.includes(id)),
                                                )
                                            }
                                        >
                                            <Group justify="flex-end" mt="sm">
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="xs"
                                                    radius="sm"
                                                    onClick={() =>
                                                        setOutsideTransferIds(
                                                            areAllOutsideTransfersSelected ? [] : allOutsideTransferIds,
                                                        )
                                                    }
                                                >
                                                    {areAllOutsideTransfersSelected ? '全解除' : '全選択'}
                                                </Button>
                                            </Group>
                                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm" mt="sm">
                                                {outsideTransferOptions.map((option) => (
                                                    <Checkbox
                                                        key={option.value}
                                                        value={option.value}
                                                        label={option.label}
                                                    />
                                                ))}
                                            </SimpleGrid>
                                        </Checkbox.Group>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>
                            <Group justify="space-between" align="end" gap="md">
                                <Text size="xs" c="dimmed">
                                    営業キロ・運賃は2026/09/29時点の情報
                                </Text>
                                <Button
                                    radius="sm"
                                    type="submit"
                                    color="dark"
                                    loading={isPending || isSearching}
                                    px="xl"
                                >
                                    検索
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Paper>

                {formError != null || queryError != null || searchError != null ? (
                    <Alert radius="sm" color="#fa5252" variant="light" title="入力を確認してください">
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

                {isSearchTruncated ? (
                    <Alert radius="sm" color="#fab005" variant="light" title="探索上限に達しました">
                        <Text size="sm">表示中の候補は探索済み範囲の結果です。</Text>
                        <Text size="sm">
                            {routes?.[0] == null
                                ? `最大回数は未確定です（上限${outsideTransferUpperBound}回）。`
                                : routes[0].outsideTransferCount === outsideTransferUpperBound
                                  ? `最大改札外乗換回数は${outsideTransferUpperBound}回で確定しています。候補の順位は未確定です。`
                                  : `見つかった最大は${routes[0].outsideTransferCount}回です。最大回数は未確定です（上限${outsideTransferUpperBound}回）。`}
                        </Text>
                    </Alert>
                ) : null}

                {routes != null ? (
                    <section aria-labelledby="search-results-title">
                        <Stack gap="lg">
                            <Group justify="space-between" align="end">
                                <div>
                                    <Title id="search-results-title" order={2} size="h3">
                                        検索結果
                                    </Title>
                                </div>
                                <Text fw={700}>改札外乗換回数の上位 {routes.length.toLocaleString('ja-JP')}件</Text>
                            </Group>
                            <Divider />

                            {routes.length === 0 ? (
                                <Paper withBorder p="xl" radius="sm">
                                    <Text ta="center" fw={700}>
                                        {isSearchTruncated
                                            ? '探索上限内では改札外乗換の候補を確認できませんでした'
                                            : '改札外乗換のルートを構成できません'}
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
