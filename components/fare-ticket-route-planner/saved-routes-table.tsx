'use client';

import { Button, Checkbox, Table } from '@mantine/core';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';
import type { SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

interface SavedRoutesTableProps {
    routes: SavedRouteState[];
    selectedRouteIds: string[];
    isAllSelected: boolean;
    onSelectAll: (checked: boolean) => void;
    onToggleSelection: (routeId: string, checked: boolean) => void;
    onViewRoute: (route: SavedRouteState) => void;
    onCallRoute: (route: SavedRouteState) => void;
    onDeleteRoute: (route: SavedRouteState) => void;
}

export function SavedRoutesTable({
    routes,
    selectedRouteIds,
    isAllSelected,
    onSelectAll,
    onToggleSelection,
    onViewRoute,
    onCallRoute,
    onDeleteRoute,
}: SavedRoutesTableProps) {
    return (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>
                        <Checkbox
                            size="xs"
                            checked={selectedRouteIds.length > 0 && isAllSelected}
                            indeterminate={selectedRouteIds.length > 0 && !isAllSelected}
                            aria-label={isAllSelected ? '全選択解除' : '全選択'}
                            onChange={(event) => onSelectAll(event.target.checked)}
                        />
                    </Table.Th>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>保存日時</Table.Th>
                    <Table.Th>発駅</Table.Th>
                    <Table.Th>着駅</Table.Th>
                    <Table.Th>経路参照</Table.Th>
                    <Table.Th>備考</Table.Th>
                    <Table.Th>操作</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {routes.map((route) => (
                    <Table.Tr key={route.id}>
                        <Table.Td>
                            <Checkbox
                                aria-label="選択"
                                size="xs"
                                checked={selectedRouteIds.includes(route.id)}
                                onChange={(event) => onToggleSelection(route.id, event.currentTarget.checked)}
                            />
                        </Table.Td>
                        <Table.Td>{route.id}</Table.Td>
                        <Table.Td>
                            {new Date(route.createdAtTs).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                timeZone: 'Asia/Tokyo',
                            })}
                        </Table.Td>
                        <Table.Td>{route.route.departure}</Table.Td>
                        <Table.Td>{route.route.destination}</Table.Td>
                        <Table.Td>
                            <SoundButton
                                variant="filled"
                                color="blue"
                                className={styles.button}
                                onClick={() => onViewRoute(route)}
                                soundType="click"
                            >
                                経路参照
                            </SoundButton>
                        </Table.Td>
                        <Table.Td>{route.route.notes}</Table.Td>
                        <Table.Td>
                            <div className="flex gap-2">
                                <SoundButton
                                    variant="filled"
                                    color="blue"
                                    className={styles.button}
                                    onClick={() => onCallRoute(route)}
                                    soundType="click"
                                >
                                    呼び出し
                                </SoundButton>
                                <Button
                                    variant="filled"
                                    color="red"
                                    className={styles.button}
                                    onClick={() => onDeleteRoute(route)}
                                >
                                    削除
                                </Button>
                            </div>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
