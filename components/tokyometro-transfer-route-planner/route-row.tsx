'use client';

import { Alert, Badge, Button, Group, Paper, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import type { PlannerAction } from '@/lib/tokyometro-transfer-route-planner/editor';
import {
    getPlannerIncomingTransfer,
    getPlannerIncomingTransfers,
    getPlannerLineOptions,
    getPlannerStationOptions,
    type PlannerState,
} from '@/lib/tokyometro-transfer-route-planner/planner';
import {
    LINE_DEFINITIONS,
    type LineId,
    STATION_NAMES,
    type StationId,
    type TransferType,
} from '@/lib/tokyometro-transfer-search/data';

export function RouteRow({
    state,
    index,
    onChange,
}: {
    state: PlannerState;
    index: number;
    onChange: (action: PlannerAction) => void;
}) {
    const row = state.rows[index];
    const lines = getPlannerLineOptions(state, index);
    const stationOptions = getPlannerStationOptions(state, index);
    const transfer = getPlannerIncomingTransfer(state, index);
    const transferTypes = [
        ...new Set(
            getPlannerIncomingTransfers(state, index)
                .filter((candidate) => candidate.toLineId === row.lineId)
                .map((candidate) => candidate.type),
        ),
    ];
    const transferName = transfer?.type === 'outside' ? '改札外乗換' : '改札内乗換';
    const line = row.lineId ? LINE_DEFINITIONS[row.lineId] : null;
    const hasLaterInput = state.rows.slice(index + 1).some((next) => next.lineId != null || next.stationId != null);
    return (
        <Stack gap="sm">
            {transfer && (
                <Group gap="sm" ml="md">
                    <Text size="sm" fw={600}>
                        {STATION_NAMES[transfer.fromStationId]}
                        {transfer.fromStationId !== transfer.toStationId && ` → ${STATION_NAMES[transfer.toStationId]}`}
                    </Text>
                    {transferTypes.length > 1 ? (
                        <Select
                            aria-label={`経路${index + 1}の乗換種別`}
                            value={transfer.type}
                            data={transferTypes.map((value) => ({
                                value,
                                label: value === 'outside' ? '改札外乗換' : '改札内乗換',
                            }))}
                            allowDeselect={false}
                            onChange={(value) =>
                                value && onChange({ type: 'transfer', index, transferType: value as TransferType })
                            }
                            radius="sm"
                            w={160}
                        />
                    ) : (
                        <Badge variant="outline" color={transfer.type === 'outside' ? 'orange' : 'gray'} radius="sm">
                            {transferName}
                        </Badge>
                    )}
                </Group>
            )}
            <Paper
                withBorder
                radius="sm"
                p="md"
                style={{ borderInlineStart: `4px solid ${line?.color ?? 'var(--mantine-color-gray-4)'}` }}
            >
                <Stack gap="sm">
                    <Group justify="space-between" gap="xs">
                        <Text fw={700}>経路{index + 1}</Text>
                        <Button
                            size="compact-sm"
                            variant="subtle"
                            color="gray"
                            radius="sm"
                            aria-label={`経路${index + 1}のこの先を削除`}
                            disabled={!hasLaterInput}
                            onClick={() => onChange({ type: 'truncate', index })}
                        >
                            この先を削除
                        </Button>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <Select
                            label="路線"
                            aria-label={`経路${index + 1}の路線`}
                            placeholder="路線を選択"
                            radius="sm"
                            data={lines}
                            value={row.lineId}
                            allowDeselect={false}
                            onChange={(value) => onChange({ type: 'line', index, lineId: value as LineId | null })}
                        />
                        <Select
                            label="接続駅"
                            aria-label={`経路${index + 1}の接続駅`}
                            placeholder="接続駅を選択"
                            radius="sm"
                            searchable
                            data={stationOptions}
                            value={row.stationId}
                            disabled={!row.lineId}
                            allowDeselect={false}
                            onChange={(value) =>
                                onChange({ type: 'station', index, stationId: value as StationId | null })
                            }
                            nothingFoundMessage="接続駅が見つかりません"
                            renderOption={({ option }) => {
                                const reason = stationOptions.find(
                                    (candidate) => candidate.value === option.value,
                                )?.reason;
                                return (
                                    <div>
                                        <Text size="sm">{option.label}</Text>
                                        {reason && <Text size="xs">{reason}</Text>}
                                    </div>
                                );
                            }}
                        />
                    </SimpleGrid>
                    {row.lineId && !stationOptions.some((option) => !option.disabled) && (
                        <Alert color="orange" radius="sm">
                            この路線では降車駅まで経路を構成できません。路線を選び直すか、前の接続駅を変更してください。
                        </Alert>
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
}
