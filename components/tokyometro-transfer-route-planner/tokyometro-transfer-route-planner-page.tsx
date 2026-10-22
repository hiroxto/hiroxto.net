'use client';

import {
    Accordion,
    Alert,
    Button,
    Group,
    Modal,
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
import { useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { RouteRow } from '@/components/tokyometro-transfer-route-planner/route-row';
import {
    createPlannerState,
    type PlannerAction,
    reversePlanner,
    tryChangePlannerStations,
    updatePlanner,
} from '@/lib/tokyometro-transfer-route-planner/editor';
import {
    buildPlannerPreview,
    getPlannerStationError,
    type PlannerState,
} from '@/lib/tokyometro-transfer-route-planner/planner';
import {
    LINE_DEFINITIONS,
    STATION_NAMES,
    STATION_READINGS,
    type StationId,
} from '@/lib/tokyometro-transfer-search/data';
import { formatDistance, type RouteResult, stations } from '@/lib/tokyometro-transfer-search/search';
import { stationIdSchema } from '@/lib/tokyometro-transfer-search/validation';

const stationOptions = stations.map((station) => ({
    value: station.id,
    label: `${station.name}｜${station.lineIds.map((lineId) => LINE_DEFINITIONS[lineId].name).join('・')}`,
    reading: STATION_READINGS[station.id],
}));
const matchesStation = (option: (typeof stationOptions)[number], query: string): boolean =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()) || option.reading.includes(query.trim());
const filterStations: OptionsFilter = ({ search, limit }) =>
    stationOptions.filter((option) => matchesStation(option, search)).slice(0, limit);
const stationLabel = (id: StationId | null): string =>
    stationOptions.find((option) => option.value === id)?.label ?? '';
const yen = (value: number): string => `${value.toLocaleString('ja-JP')}円`;

function PlannerResult({ preview }: { preview: NonNullable<ReturnType<typeof buildPlannerPreview>> }) {
    const { result, complete, fromStationId, toStationId } = preview;
    return (
        <Paper component="section" aria-label="作成結果" withBorder p="lg" radius="sm">
            <Stack gap="md">
                <Title order={2} size="h3">
                    作成結果
                    {!complete && (
                        <>
                            {' '}
                            (
                            <Text component="span" c="red" inherit>
                                入力途中
                            </Text>
                            )
                        </>
                    )}
                </Title>
                <Text>
                    {STATION_NAMES[fromStationId]} → {STATION_NAMES[toStationId]}
                </Text>
                <Group gap="lg">
                    <Text fw={700}>改札外乗換 {result.outsideTransferCount}回</Text>
                    <Text fw={700}>改札内乗換 {result.insideTransferCount}回</Text>
                </Group>
                <Group gap="xl">
                    <div>
                        <Text size="sm" c="dimmed">
                            IC運賃
                        </Text>
                        <Text size="xl" fw={700}>
                            {yen(result.fare.ic)}
                        </Text>
                    </div>
                    <div>
                        <Text size="sm" c="dimmed">
                            きっぷ運賃
                        </Text>
                        <Text size="xl" fw={700}>
                            {yen(result.fare.ticket)}
                        </Text>
                    </div>
                </Group>
            </Stack>
        </Paper>
    );
}

function DebugDetails({ result }: { result: RouteResult }) {
    return (
        <Accordion variant="contained" radius="sm">
            <Accordion.Item value="debug">
                <Accordion.Control>デバッグ情報</Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="xs">
                        <Text size="sm">実走営業キロ: {formatDistance(result.actualDistanceTenths)}</Text>
                        <Text size="sm">運賃計算用最短営業キロ: {formatDistance(result.shortestDistanceTenths)}</Text>
                        {result.fareCheckpoints.map((checkpoint, index) => (
                            <Text size="sm" key={checkpoint.stationId}>
                                改札外乗換 {index + 1} ({STATION_NAMES[checkpoint.stationId]}) :{' '}
                                {formatDistance(checkpoint.shortestDistanceTenths)} / IC {yen(checkpoint.fare.ic)} /
                                きっぷ {yen(checkpoint.fare.ticket)}
                            </Text>
                        ))}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
}

export function TokyoMetroTransferRoutePlannerPage() {
    const [state, setState] = useState(createPlannerState);
    const [hideUnavailableStations, setHideUnavailableStations] = useState(true);
    const [searches, setSearches] = useState({ fromStationId: '', toStationId: '' });
    const [confirmReverse, setConfirmReverse] = useState(false);
    const [pendingStations, setPendingStations] = useState<Pick<PlannerState, 'fromStationId' | 'toStationId'> | null>(
        null,
    );
    const preview = buildPlannerPreview(state);
    const lastRow = state.rows.at(-1);
    const canAppend =
        !getPlannerStationError(state) &&
        (!lastRow || (lastRow.stationId != null && lastRow.stationId !== state.toStationId));
    const stationError = state.fromStationId && state.toStationId ? getPlannerStationError(state) : null;
    function apply(action: PlannerAction) {
        setState((previous) => updatePlanner(previous, action));
    }
    function changeEndpoint(field: 'fromStationId' | 'toStationId', value: string | null) {
        const parsed = stationIdSchema.safeParse(value);
        const id = parsed.success ? parsed.data : null;
        const stations = { fromStationId: state.fromStationId, toStationId: state.toStationId, [field]: id };
        const next = tryChangePlannerStations(state, stations.fromStationId, stations.toStationId);
        if (next) replaceState(next);
        else {
            setPendingStations(stations);
            setSearches({
                fromStationId: stationLabel(state.fromStationId),
                toStationId: stationLabel(state.toStationId),
            });
        }
    }
    function searchEndpoint(field: 'fromStationId' | 'toStationId', value: string) {
        setSearches((previous) => ({ ...previous, [field]: value }));
    }
    function cancelStationChange() {
        setPendingStations(null);
        replaceState(state);
    }
    function replaceState(next: PlannerState) {
        setState(next);
        setSearches({ fromStationId: stationLabel(next.fromStationId), toStationId: stationLabel(next.toStationId) });
    }
    function reverse() {
        const next = reversePlanner(state);
        if (next) replaceState(next);
        else setConfirmReverse(true);
    }
    return (
        <SiteSubpageFrame
            items={[{ label: 'Tools', href: '/tools' }, { label: '東京メトロ 改札外乗換経路作成' }]}
            title="東京メトロ 改札外乗換経路作成"
            description="東京メトロの改札外乗換経路を作成する"
        >
            <Stack gap="lg">
                <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            {(['fromStationId', 'toStationId'] as const).map((field) => (
                                <Select
                                    key={field}
                                    label={field === 'fromStationId' ? '乗車駅' : '降車駅'}
                                    placeholder="駅を選択"
                                    radius="sm"
                                    searchable
                                    allowDeselect={false}
                                    clearable={state[field] != null}
                                    // nullではSelectが検索文字を消すため、未選択は空文字で表す。
                                    value={state[field] ?? ''}
                                    data={stationOptions}
                                    filter={filterStations}
                                    searchValue={searches[field]}
                                    onSearchChange={(value) => searchEndpoint(field, value)}
                                    onChange={(value) => changeEndpoint(field, value)}
                                    nothingFoundMessage="駅が見つかりません"
                                    error={
                                        searches[field].trim() &&
                                        !stationOptions.some((option) => matchesStation(option, searches[field]))
                                            ? '選択肢から駅を指定してください'
                                            : null
                                    }
                                />
                            ))}
                        </SimpleGrid>
                        <Group justify="flex-end">
                            <Button
                                variant="light"
                                radius="sm"
                                onClick={reverse}
                                leftSection={<ArrowsLeftRightIcon size={18} />}
                            >
                                発着逆転
                            </Button>
                        </Group>
                        <Accordion variant="contained" radius="sm">
                            <Accordion.Item value="options">
                                <Accordion.Control>詳細指定</Accordion.Control>
                                <Accordion.Panel>
                                    <Switch
                                        label="利用不可能な駅を非表示にする"
                                        checked={hideUnavailableStations}
                                        onChange={(event) => setHideUnavailableStations(event.currentTarget.checked)}
                                    />
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                        {stationError && (
                            <Alert color="red" radius="sm">
                                {stationError}
                            </Alert>
                        )}
                    </Stack>
                </Paper>
                <section aria-label="経路入力">
                    <Stack gap="md">
                        <Title order={2} size="h3">
                            経路
                        </Title>
                        <Text size="sm" c="dimmed">
                            路線と接続駅を順に選択してください。利用不可能な接続駅の表示は詳細指定で変更できます。
                        </Text>
                        {state.rows.map((row, index) => (
                            <RouteRow
                                key={`${state.rows[index - 1]?.stationId ?? 'start'}:${row.lineId}`}
                                state={state}
                                index={index}
                                onChange={apply}
                                hideUnavailableStations={hideUnavailableStations}
                            />
                        ))}
                        {canAppend && (
                            <Button variant="light" radius="sm" onClick={() => apply({ type: 'append' })}>
                                経路を追加
                            </Button>
                        )}
                    </Stack>
                </section>
                <div aria-live="polite">
                    {preview ? <PlannerResult preview={preview} /> : <Text c="dimmed">経路を入力してください</Text>}
                </div>
                {preview && <DebugDetails result={preview.result} />}
            </Stack>
            <Modal
                opened={confirmReverse}
                onClose={() => setConfirmReverse(false)}
                title="発着逆転の確認"
                radius="sm"
                centered
            >
                <Text>経路が完成していないため逆転できません。経路を破棄して乗車駅と降車駅を入れ替えますか？</Text>
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" radius="sm" onClick={() => setConfirmReverse(false)}>
                        キャンセル
                    </Button>
                    <Button
                        radius="sm"
                        onClick={() => {
                            replaceState(createPlannerState(state.toStationId, state.fromStationId));
                            setConfirmReverse(false);
                        }}
                    >
                        経路を破棄して逆転
                    </Button>
                </Group>
            </Modal>
            <Modal
                opened={pendingStations != null}
                onClose={cancelStationChange}
                title="発着駅変更の確認"
                radius="sm"
                centered
            >
                <Text>変更後の発着駅では入力済みの経路を構成できません。経路を破棄して発着駅を変更しますか？</Text>
                <Text size="sm" mt="sm">
                    {pendingStations?.fromStationId ? STATION_NAMES[pendingStations.fromStationId] : '未指定'} →{' '}
                    {pendingStations?.toStationId ? STATION_NAMES[pendingStations.toStationId] : '未指定'}
                </Text>
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" radius="sm" onClick={cancelStationChange}>
                        キャンセル
                    </Button>
                    <Button
                        radius="sm"
                        onClick={() => {
                            if (pendingStations) {
                                replaceState(
                                    createPlannerState(pendingStations.fromStationId, pendingStations.toStationId),
                                );
                                setPendingStations(null);
                            }
                        }}
                    >
                        経路を破棄して変更
                    </Button>
                </Group>
            </Modal>
        </SiteSubpageFrame>
    );
}
