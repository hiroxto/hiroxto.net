'use client';

import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ConfirmationModal, useConfirmationModal } from '@/components/fare-ticket-route-planner/confirmation-modal';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { PageShell } from '@/components/fare-ticket-route-planner/page-shell';
import { SavedRoutesTable } from '@/components/fare-ticket-route-planner/saved-routes-table';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';
import { format } from '@/lib/fare-ticket-route-planner/formatter';
import type { RouteState, SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

export function SavedRoutesPage() {
    const router = useRouter();
    const { routes, deleteRoute, bulkDeleteRoute } = useSavedRouteStore(
        useShallow((state) => ({
            routes: state.routes,
            deleteRoute: state.deleteRoute,
            bulkDeleteRoute: state.bulkDeleteRoute,
        })),
    );
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
    const handleSelectAll = (checked: boolean) => {
        setSelectedRouteIds(checked ? allRouteIds : []);
    };
    const handleToggleSelection = (routeId: string, checked: boolean) => {
        setSelectedRouteIds((currentIds) =>
            checked ? [...currentIds, routeId] : currentIds.filter((id) => id !== routeId),
        );
    };
    const handleViewRoute = (route: SavedRouteState) => {
        setSelectedRoute(route.route);
        open();
    };
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
        <PageShell title="保存済み経路" description="保存した経路の一覧と操作">
            <Group gap="xs" mb="md">
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

            <SavedRoutesTable
                routes={routes}
                selectedRouteIds={selectedRouteIds}
                isAllSelected={isAllSelected}
                onSelectAll={handleSelectAll}
                onToggleSelection={handleToggleSelection}
                onViewRoute={handleViewRoute}
                onCallRoute={(route) => callState(route.route)}
                onDeleteRoute={(route) => openIndividualDeleteModal(() => deleteRoute(route.id))}
            />

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
        </PageShell>
    );
}
