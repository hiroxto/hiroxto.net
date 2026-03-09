'use client';

import { Button, type ButtonProps, Grid, Modal, Select } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ConfirmationModal, useConfirmationModal } from '@/components/fare-ticket-route-planner/confirmation-modal';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';
import type { SoundType } from '@/components/fare-ticket-route-planner/use-sound';

interface ControlButtonDefinition {
    key: string;
    label: string;
    span?: number;
    offset?: number;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    soundType?: SoundType;
    disabled?: boolean;
    href?: string;
    onClick?: () => void;
}

interface ModalState {
    opened: boolean;
    onClose: () => void;
}

function GridActionButton({ definition }: { definition: ControlButtonDefinition }) {
    const { key: _key, label, span = 3, offset, href, soundType = 'click', onClick, ...buttonProps } = definition;

    return (
        <Grid.Col span={span} offset={offset}>
            {href == null || onClick != null ? (
                <SoundButton
                    {...buttonProps}
                    className={styles.button}
                    onClick={onClick ?? (() => {})}
                    soundType={soundType}
                    fullWidth
                >
                    {label}
                </SoundButton>
            ) : (
                <Button {...buttonProps} className={styles.button} component={Link} href={href} fullWidth>
                    {label}
                </Button>
            )}
        </Grid.Col>
    );
}

function CalendarModal({
    modalState,
    calendarValue,
    onChange,
}: {
    modalState: ModalState;
    calendarValue: Date | null;
    onChange: (newValue: string | Date | null) => void;
}) {
    return (
        <Modal opened={modalState.opened} onClose={modalState.onClose} title="カレンダー入力" size="auto">
            <DatePicker
                value={calendarValue}
                onChange={onChange}
                firstDayOfWeek={0}
                locale="ja"
                level="month"
                minDate={new Date()}
                size="xl"
            />
        </Modal>
    );
}

function SaveRouteModal({
    modalState,
    saveToId,
    setSaveToId,
    saveLabels,
    onCreate,
    onUpdate,
}: {
    modalState: ModalState;
    saveToId: string | null;
    setSaveToId: (value: string | null) => void;
    saveLabels: Array<{ value: string; label: string }>;
    onCreate: () => void;
    onUpdate: () => void;
}) {
    return (
        <Modal opened={modalState.opened} onClose={modalState.onClose} title="保存・更新">
            <SoundButton variant="filled" color="blue" className={styles.button} onClick={onCreate} soundType="click">
                新規保存
            </SoundButton>

            <Select
                label="更新先を選択"
                placeholder="更新先を選択"
                data={saveLabels}
                value={saveToId}
                onChange={setSaveToId}
            />
            <SoundButton
                variant="filled"
                color="blue"
                className={styles.button}
                disabled={saveToId == null}
                onClick={onUpdate}
                soundType="click"
            >
                更新
            </SoundButton>
        </Modal>
    );
}

export function ControlButtons() {
    const {
        type,
        month,
        day,
        dateOption,
        departure,
        destination,
        routes,
        notes,
        resetType,
        setMonth,
        setDay,
        setDateWithIndex,
        enableDateOption,
        reverse,
        resetStations,
        addRoute,
        deleteEmptyRoutes,
        deleteAllRoutes,
        resetNotes,
    } = useRouteStateStore(
        useShallow((state) => ({
            type: state.type,
            month: state.month,
            day: state.day,
            dateOption: state.dateOption,
            departure: state.departure,
            destination: state.destination,
            routes: state.routes,
            notes: state.notes,
            resetType: state.resetType,
            setMonth: state.setMonth,
            setDay: state.setDay,
            setDateWithIndex: state.setDateWithIndex,
            enableDateOption: state.useDate,
            reverse: state.reverse,
            resetStations: state.resetStations,
            addRoute: state.addRoute,
            deleteEmptyRoutes: state.deleteEmptyRoutes,
            deleteAllRoutes: state.deleteAllRoutes,
            resetNotes: state.resetNotes,
        })),
    );
    const {
        routes: savedRoutes,
        saveRoute,
        updateRoute,
    } = useSavedRouteStore(
        useShallow((state) => ({
            routes: state.routes,
            saveRoute: state.saveRoute,
            updateRoute: state.updateRoute,
        })),
    );
    const { useComplete, enableComplete, disableComplete } = useInputSettingStore(
        useShallow((state) => ({
            useComplete: state.useComplete,
            enableComplete: state.enableComplete,
            disableComplete: state.disableComplete,
        })),
    );
    const [saveToId, setSaveToId] = useState<string | null>(null);
    const [calendarValue, setCalendarValue] = useState<Date | null>(null);
    const [isOpenedCalendarModel, calendarModalHandlers] = useDisclosure(false);
    const [isOpenedSaveModel, saveModalHandlers] = useDisclosure(false);
    const clearSettingModal = useConfirmationModal();
    const clearAllRoutesModal = useConfirmationModal();
    const clearNotesModal = useConfirmationModal();

    const saveLabels = savedRoutes.map((route) => ({
        value: route.id,
        label: `${route.route.departure} → ${route.route.destination} / ID: ${route.id}`,
    }));

    const baseGrayButtons: ControlButtonDefinition[] = [
        { key: 'today', label: '本日', variant: 'filled', color: 'gray', onClick: () => setDateWithIndex(0) },
        { key: 'tomorrow', label: '明日', variant: 'filled', color: 'gray', onClick: () => setDateWithIndex(1) },
        {
            key: 'day-after-tomorrow',
            label: '明後日',
            variant: 'filled',
            color: 'gray',
            onClick: () => setDateWithIndex(2),
        },
        {
            key: 'calendar',
            label: 'カレンダー入力',
            variant: 'filled',
            color: 'gray',
            onClick: calendarModalHandlers.open,
        },
        { key: 'reverse', label: '発着逆転', variant: 'filled', color: 'gray', onClick: reverse },
        { key: 'add-route', label: '経路追加', variant: 'filled', color: 'gray', onClick: () => addRoute(-1) },
    ];

    const destructiveButtons: ControlButtonDefinition[] = [
        {
            key: 'delete-empty-routes',
            label: '空経路クリア',
            variant: 'light',
            color: 'red',
            onClick: deleteEmptyRoutes,
        },
        {
            key: 'clear-setting',
            label: '設定クリア',
            variant: 'filled',
            color: 'red',
            soundType: 'chime',
            onClick: () =>
                clearSettingModal.openModal(() => {
                    resetType();
                    enableDateOption();
                    resetStations();
                }),
        },
        {
            key: 'clear-all-routes',
            label: '全経路クリア',
            variant: 'filled',
            color: 'red',
            soundType: 'chime',
            onClick: () => clearAllRoutesModal.openModal(deleteAllRoutes),
        },
        {
            key: 'clear-notes',
            label: '備考クリア',
            variant: 'filled',
            color: 'red',
            soundType: 'chime',
            onClick: () => clearNotesModal.openModal(resetNotes),
        },
        {
            key: 'toggle-complete',
            label: useComplete ? '補完無効化' : '補完有効化',
            variant: 'filled',
            color: useComplete ? 'gray' : 'blue',
            onClick: () => (useComplete ? disableComplete() : enableComplete()),
        },
        {
            key: 'saved-routes',
            label: '保存済み経路',
            variant: 'filled',
            color: 'blue',
            href: '/tools/fare-ticket-route-planner/states',
            offset: 3,
        },
        {
            key: 'save',
            label: '保存・更新',
            variant: 'filled',
            color: 'blue',
            onClick: saveModalHandlers.open,
        },
    ];

    const handleCalendarChange = (newValue: string | Date | null) => {
        const newValueDate = newValue == null ? null : new Date(newValue);
        if (
            calendarValue != null &&
            newValueDate != null &&
            calendarValue.getMonth() === newValueDate.getMonth() &&
            calendarValue.getDay() === newValueDate.getDay()
        ) {
            setMonth(String(newValueDate.getMonth() + 1));
            setDay(String(newValueDate.getDate()));
            calendarModalHandlers.close();
        }

        setCalendarValue(newValueDate);
    };

    const handleCreateRoute = () => {
        saveRoute({
            type,
            month,
            day,
            dateOption,
            departure,
            via: '',
            destination,
            routes,
            routes2: [],
            notes,
        });
        setSaveToId(null);
        saveModalHandlers.close();
    };

    const handleUpdateRoute = () => {
        if (saveToId == null) {
            return;
        }

        updateRoute(saveToId, {
            type,
            month,
            day,
            dateOption,
            departure,
            destination,
            routes,
            notes,
        });
        saveModalHandlers.close();
    };

    return (
        <>
            <Grid columns={12} gutter="xs">
                {baseGrayButtons.map((definition) => (
                    <GridActionButton key={definition.key} definition={definition} />
                ))}
                <Grid.Col span={3} />
                <Grid.Col span={3} />
                {destructiveButtons.map((definition) => (
                    <GridActionButton key={definition.key} definition={definition} />
                ))}
            </Grid>

            <CalendarModal
                modalState={{ opened: isOpenedCalendarModel, onClose: calendarModalHandlers.close }}
                calendarValue={calendarValue}
                onChange={handleCalendarChange}
            />

            <SaveRouteModal
                modalState={{ opened: isOpenedSaveModel, onClose: saveModalHandlers.close }}
                saveToId={saveToId}
                setSaveToId={setSaveToId}
                saveLabels={saveLabels}
                onCreate={handleCreateRoute}
                onUpdate={handleUpdateRoute}
            />

            <ConfirmationModal
                opened={clearSettingModal.isOpened}
                onClose={clearSettingModal.closeModal}
                onConfirm={clearSettingModal.handleConfirm}
                title="設定のクリア"
                message="設定をクリアしますか？"
                confirmButtonText="クリア"
            />

            <ConfirmationModal
                opened={clearAllRoutesModal.isOpened}
                onClose={clearAllRoutesModal.closeModal}
                onConfirm={clearAllRoutesModal.handleConfirm}
                title="全経路のクリア"
                message="全経路をクリアしますか？"
                confirmButtonText="クリア"
            />

            <ConfirmationModal
                opened={clearNotesModal.isOpened}
                onClose={clearNotesModal.closeModal}
                onConfirm={clearNotesModal.handleConfirm}
                title="備考のクリア"
                message="備考をクリアしますか？"
                confirmButtonText="クリア"
            />
        </>
    );
}
