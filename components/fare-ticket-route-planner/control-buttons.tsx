'use client';

import { Button, Grid, Modal, Select } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ConfirmationModal, useConfirmationModal } from '@/components/fare-ticket-route-planner/confirmation-modal';
import {
    type ControlButtonDefinition,
    createBaseGrayButtonDefinitions,
    createSaveLabels,
    createSaveRoutePayload,
    createSecondaryButtonDefinitions,
    createUpdateRoutePayload,
    isSameCalendarDate,
} from '@/components/fare-ticket-route-planner/control-buttons-ui';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';

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

    const saveLabels = createSaveLabels(savedRoutes);

    const baseGrayButtons = createBaseGrayButtonDefinitions({
        setDateWithIndex,
        openCalendarModal: calendarModalHandlers.open,
        reverse,
        addRoute,
    });

    const handleClearSetting = () => {
        clearSettingModal.openModal(() => {
            resetType();
            enableDateOption();
            resetStations();
        });
    };

    const handleClearAllRoutes = () => clearAllRoutesModal.openModal(deleteAllRoutes);
    const handleClearNotes = () => clearNotesModal.openModal(resetNotes);

    const secondaryButtons = createSecondaryButtonDefinitions({
        deleteEmptyRoutes,
        openClearSettingModal: handleClearSetting,
        openClearAllRoutesModal: handleClearAllRoutes,
        openClearNotesModal: handleClearNotes,
        useComplete,
        enableComplete,
        disableComplete,
        savedRoutesHref: '/tools/fare-ticket-route-planner/states',
        openSaveModal: saveModalHandlers.open,
    });

    const handleCalendarChange = (newValue: string | Date | null) => {
        const newValueDate = newValue == null ? null : new Date(newValue);
        if (calendarValue != null && newValueDate != null && isSameCalendarDate(calendarValue, newValueDate)) {
            setMonth(String(newValueDate.getMonth() + 1));
            setDay(String(newValueDate.getDate()));
            calendarModalHandlers.close();
        }

        setCalendarValue(newValueDate);
    };

    const handleCreateRoute = () => {
        const routeState = useRouteStateStore.getState();
        saveRoute(createSaveRoutePayload(routeState));
        setSaveToId(null);
        saveModalHandlers.close();
    };

    const handleUpdateRoute = () => {
        if (saveToId == null) {
            return;
        }

        const routeState = useRouteStateStore.getState();
        updateRoute(saveToId, createUpdateRoutePayload(routeState));
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
                {secondaryButtons.map((definition) => (
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
