'use client';

import { Button, Grid, Modal, Select } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useState } from 'react';
import { ConfirmationModal, useConfirmationModal } from '@/components/fare-ticket-route-planner/confirmation-modal';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';

export function ControlButtons() {
    const type = useRouteStateStore((state) => state.type);
    const month = useRouteStateStore((state) => state.month);
    const day = useRouteStateStore((state) => state.day);
    const dateOption = useRouteStateStore((state) => state.dateOption);
    const departure = useRouteStateStore((state) => state.departure);
    const destination = useRouteStateStore((state) => state.destination);
    const routes = useRouteStateStore((state) => state.routes);
    const notes = useRouteStateStore((state) => state.notes);
    const resetType = useRouteStateStore((state) => state.resetType);
    const setMonth = useRouteStateStore((state) => state.setMonth);
    const setDay = useRouteStateStore((state) => state.setDay);
    const setDateWithIndex = useRouteStateStore((state) => state.setDateWithIndex);
    const enableDateOption = useRouteStateStore((state) => state.useDate);
    const reverse = useRouteStateStore((state) => state.reverse);
    const resetStations = useRouteStateStore((state) => state.resetStations);
    const addRoute = useRouteStateStore((state) => state.addRoute);
    const deleteEmptyRoutes = useRouteStateStore((state) => state.deleteEmptyRoutes);
    const deleteAllRoutes = useRouteStateStore((state) => state.deleteAllRoutes);
    const resetNotes = useRouteStateStore((state) => state.resetNotes);
    const savedRoutes = useSavedRouteStore((state) => state.routes);
    const saveRoute = useSavedRouteStore((state) => state.saveRoute);
    const updateRoute = useSavedRouteStore((state) => state.updateRoute);
    const useComplete = useInputSettingStore((state) => state.useComplete);
    const enableComplete = useInputSettingStore((state) => state.enableComplete);
    const disableComplete = useInputSettingStore((state) => state.disableComplete);
    const [saveToId, setSaveToId] = useState<string | null>(null);
    const [isOpenedCalendarModel, { open: openCalendarModal, close: closeCalendarModal }] = useDisclosure(false);
    const [calendarValue, setCalendarValue] = useState<Date | null>(null);
    const [isOpenedSaveModel, { open: openSaveModal, close: closeSaveModal }] = useDisclosure(false);
    const {
        isOpened: isOpenedClearSettingModal,
        openModal: openClearSettingModal,
        closeModal: closeClearSettingModal,
        handleConfirm: handleClearSettingConfirm,
    } = useConfirmationModal();
    const {
        isOpened: isOpenedClearAllRoutesModal,
        openModal: openClearAllRoutesModal,
        closeModal: closeClearAllRoutesModal,
        handleConfirm: handleClearAllRoutesConfirm,
    } = useConfirmationModal();
    const {
        isOpened: isOpenedClearNotesModal,
        openModal: openClearNotesModal,
        closeModal: closeClearNotesModal,
        handleConfirm: handleClearNotesConfirm,
    } = useConfirmationModal();

    return (
        <>
            <Grid columns={12} gutter="xs">
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="gray"
                        className={styles.button}
                        onClick={() => setDateWithIndex(0)}
                        soundType="click"
                        fullWidth
                    >
                        本日
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="gray"
                        className={styles.button}
                        onClick={() => setDateWithIndex(1)}
                        soundType="click"
                        fullWidth
                    >
                        明日
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="gray"
                        className={styles.button}
                        onClick={() => setDateWithIndex(2)}
                        soundType="click"
                        fullWidth
                    >
                        明後日
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="gray"
                        className={styles.button}
                        onClick={openCalendarModal}
                        soundType="click"
                        fullWidth
                    >
                        カレンダー入力
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="gray"
                        className={styles.button}
                        onClick={reverse}
                        soundType="click"
                        fullWidth
                    >
                        発着逆転
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="gray"
                        className={styles.button}
                        onClick={() => addRoute(-1)}
                        soundType="click"
                        fullWidth
                    >
                        経路追加
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3} />
                <Grid.Col span={3} />
                <Grid.Col span={3}>
                    <SoundButton
                        variant="light"
                        color="red"
                        className={styles.button}
                        onClick={deleteEmptyRoutes}
                        soundType="click"
                        fullWidth
                    >
                        空経路クリア
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="red"
                        className={styles.button}
                        onClick={() =>
                            openClearSettingModal(() => {
                                resetType();
                                enableDateOption();
                                resetStations();
                            })
                        }
                        soundType="chime"
                        fullWidth
                    >
                        設定クリア
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="red"
                        className={styles.button}
                        onClick={() => openClearAllRoutesModal(deleteAllRoutes)}
                        soundType="chime"
                        fullWidth
                    >
                        全経路クリア
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="red"
                        className={styles.button}
                        onClick={() => openClearNotesModal(resetNotes)}
                        soundType="chime"
                        fullWidth
                    >
                        備考クリア
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color={useComplete ? 'gray' : 'blue'}
                        className={styles.button}
                        onClick={() => (useComplete ? disableComplete() : enableComplete())}
                        soundType="click"
                        fullWidth
                    >
                        {useComplete ? '補完無効化' : '補完有効化'}
                    </SoundButton>
                </Grid.Col>
                <Grid.Col span={3} offset={3}>
                    <Button
                        variant="filled"
                        color="blue"
                        className={styles.button}
                        component={Link}
                        href="/tools/fare-ticket-route-planner/states"
                        fullWidth
                    >
                        保存済み経路
                    </Button>
                </Grid.Col>
                <Grid.Col span={3}>
                    <SoundButton
                        variant="filled"
                        color="blue"
                        className={styles.button}
                        onClick={openSaveModal}
                        soundType="click"
                        fullWidth
                    >
                        保存・更新
                    </SoundButton>
                </Grid.Col>
            </Grid>

            <Modal opened={isOpenedCalendarModel} onClose={closeCalendarModal} title="カレンダー入力" size="auto">
                <DatePicker
                    value={calendarValue}
                    onChange={(newValue) => {
                        const newValueDate = newValue == null ? null : new Date(newValue);
                        if (
                            calendarValue != null &&
                            newValueDate != null &&
                            calendarValue.getMonth() === newValueDate.getMonth() &&
                            calendarValue.getDay() === newValueDate.getDay()
                        ) {
                            setMonth(String(newValueDate.getMonth() + 1));
                            setDay(String(newValueDate.getDate()));
                            closeCalendarModal();
                        }

                        setCalendarValue(newValueDate);
                    }}
                    firstDayOfWeek={0}
                    locale="ja"
                    level="month"
                    minDate={new Date()}
                    size="xl"
                />
            </Modal>
            <Modal opened={isOpenedSaveModel} onClose={closeSaveModal} title="保存・更新">
                <SoundButton
                    variant="filled"
                    color="blue"
                    className={styles.button}
                    onClick={() => {
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
                        closeSaveModal();
                    }}
                    soundType="click"
                >
                    新規保存
                </SoundButton>

                <Select
                    label="更新先を選択"
                    placeholder="更新先を選択"
                    data={savedRoutes.map((route) => ({
                        value: route.id,
                        label: `${route.route.departure} → ${route.route.destination} / ID: ${route.id}`,
                    }))}
                    value={saveToId}
                    onChange={(value) => setSaveToId(value)}
                />
                <SoundButton
                    variant="filled"
                    color="blue"
                    className={styles.button}
                    disabled={saveToId == null}
                    onClick={() => {
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
                        closeSaveModal();
                    }}
                    soundType="click"
                >
                    更新
                </SoundButton>
            </Modal>
            <ConfirmationModal
                opened={isOpenedClearSettingModal}
                onClose={closeClearSettingModal}
                onConfirm={handleClearSettingConfirm}
                title="設定のクリア"
                message="設定をクリアしますか？"
                confirmButtonText="クリア"
            />

            <ConfirmationModal
                opened={isOpenedClearAllRoutesModal}
                onClose={closeClearAllRoutesModal}
                onConfirm={handleClearAllRoutesConfirm}
                title="全経路のクリア"
                message="全経路をクリアしますか？"
                confirmButtonText="クリア"
            />

            <ConfirmationModal
                opened={isOpenedClearNotesModal}
                onClose={closeClearNotesModal}
                onConfirm={handleClearNotesConfirm}
                title="備考のクリア"
                message="備考をクリアしますか？"
                confirmButtonText="クリア"
            />
        </>
    );
}
