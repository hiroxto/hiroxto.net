'use client';

import { Button, Checkbox, Group, Modal, Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ConfirmationModal, useConfirmationModal } from '@/components/fare-ticket-route-planner/confirmation-modal';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';
import { format } from '@/lib/fare-ticket-route-planner/formatter';
import type { RouteState } from '@/lib/fare-ticket-route-planner/types';

export function SavedRoutesPage() {
    const router = useRouter();
    const routes = useSavedRouteStore((state) => state.routes);
    const deleteRoute = useSavedRouteStore((state) => state.deleteRoute);
    const bulkDeleteRoute = useSavedRouteStore((state) => state.bulkDeleteRoute);
    const reconstruct = useRouteStateStore((state) => state.reconstruct);
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedRoute, setSelectedRoute] = useState<RouteState | null>(null);
    const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
    const output = useMemo(() => {
        if (selectedRoute == null) {
            return '';
        }

        const routesOutput = format(selectedRoute.routes);

        return `${selectedRoute.departure} → ${selectedRoute.destination}\n\n${routesOutput}`.trim();
    }, [selectedRoute]);
    const allRouteIds = useMemo(() => routes.map((route) => route.id), [routes]);
    const isAllSelected = useMemo(
        () => selectedRouteIds.length === allRouteIds.length,
        [selectedRouteIds, allRouteIds],
    );
    const callState = (state: RouteState) => {
        reconstruct(state);
        router.push('/tools/fare-ticket-route-planner');
    };
    const {
        isOpened: isOpenedBulkDeleteModal,
        openModal: openBulkDeleteModal,
        closeModal: closeBulkDeleteModal,
        handleConfirm: handleBulkDeleteConfirm,
    } = useConfirmationModal();
    const {
        isOpened: isOpenedIndividualDeleteModal,
        openModal: openIndividualDeleteModal,
        closeModal: closeIndividualDeleteModal,
        handleConfirm: handleIndividualDeleteConfirm,
    } = useConfirmationModal();

    return (
        <div className={styles.app}>
            <div className={styles.container}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>保存済み経路</h1>
                    <p className={styles.description}>保存した経路の一覧と操作</p>
                    <Group gap="xs">
                        <Button
                            variant="filled"
                            color="blue"
                            className={styles.button}
                            component={Link}
                            href="/tools/fare-ticket-route-planner"
                        >
                            入力画面
                        </Button>
                        <Button
                            variant="filled"
                            color="red"
                            className={styles.button}
                            disabled={selectedRouteIds.length === 0}
                            onClick={() =>
                                openBulkDeleteModal(() => {
                                    bulkDeleteRoute(selectedRouteIds);
                                    setSelectedRouteIds([]);
                                })
                            }
                        >
                            削除
                        </Button>
                    </Group>
                </div>

                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>
                                <Checkbox
                                    size="xs"
                                    checked={selectedRouteIds.length > 0 && isAllSelected}
                                    indeterminate={selectedRouteIds.length > 0 && !isAllSelected}
                                    aria-label={isAllSelected ? '全選択解除' : '全選択'}
                                    onChange={(event) =>
                                        event.target.checked
                                            ? setSelectedRouteIds(allRouteIds)
                                            : setSelectedRouteIds([])
                                    }
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
                                        onChange={(event) =>
                                            setSelectedRouteIds(
                                                event.currentTarget.checked
                                                    ? [...selectedRouteIds, route.id]
                                                    : selectedRouteIds.filter((id) => id !== route.id),
                                            )
                                        }
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
                                        onClick={() => {
                                            setSelectedRoute(route.route);
                                            open();
                                        }}
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
                                            onClick={() => callState(route.route)}
                                            soundType="click"
                                        >
                                            呼び出し
                                        </SoundButton>
                                        <Button
                                            variant="filled"
                                            color="red"
                                            className={styles.button}
                                            onClick={() =>
                                                openIndividualDeleteModal(() => {
                                                    deleteRoute(route.id);
                                                })
                                            }
                                        >
                                            削除
                                        </Button>
                                    </div>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>

                <Modal opened={opened} onClose={close} title="経路参照">
                    <pre className={styles.output}>{output}</pre>
                </Modal>

                <ConfirmationModal
                    opened={isOpenedBulkDeleteModal}
                    onClose={closeBulkDeleteModal}
                    onConfirm={handleBulkDeleteConfirm}
                    title="経路の削除"
                    message="選択した経路を削除しますか？"
                    confirmButtonText="削除"
                />

                <ConfirmationModal
                    opened={isOpenedIndividualDeleteModal}
                    onClose={closeIndividualDeleteModal}
                    onConfirm={handleIndividualDeleteConfirm}
                    title="経路の削除"
                    message="この経路を削除しますか？"
                    confirmButtonText="削除"
                />
            </div>
        </div>
    );
}
