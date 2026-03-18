'use client';

import type { ButtonProps } from '@mantine/core';
import type { SoundType } from '@/components/fare-ticket-route-planner/use-sound';
import type { RouteState, SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

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

interface BaseGrayButtonArgs {
    setDateWithIndex: (value: number) => void;
    openCalendarModal: () => void;
    reverse: () => void;
    addRoute: (index: number) => void;
}

export const createBaseGrayButtonDefinitions = ({
    setDateWithIndex,
    openCalendarModal,
    reverse,
    addRoute,
}: BaseGrayButtonArgs): ControlButtonDefinition[] => [
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
        onClick: openCalendarModal,
    },
    { key: 'reverse', label: '発着逆転', variant: 'filled', color: 'gray', onClick: reverse },
    { key: 'add-route', label: '経路追加', variant: 'filled', color: 'gray', onClick: () => addRoute(-1) },
];

interface SecondaryButtonArgs {
    deleteEmptyRoutes: () => void;
    openClearSettingModal: () => void;
    openClearAllRoutesModal: () => void;
    openClearNotesModal: () => void;
    useComplete: boolean;
    enableComplete: () => void;
    disableComplete: () => void;
    savedRoutesHref: string;
    openSaveModal: () => void;
}

export const createSecondaryButtonDefinitions = ({
    deleteEmptyRoutes,
    openClearSettingModal,
    openClearAllRoutesModal,
    openClearNotesModal,
    useComplete,
    enableComplete,
    disableComplete,
    savedRoutesHref,
    openSaveModal,
}: SecondaryButtonArgs): ControlButtonDefinition[] => [
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
        onClick: openClearSettingModal,
    },
    {
        key: 'clear-all-routes',
        label: '全経路クリア',
        variant: 'filled',
        color: 'red',
        soundType: 'chime',
        onClick: openClearAllRoutesModal,
    },
    {
        key: 'clear-notes',
        label: '備考クリア',
        variant: 'filled',
        color: 'red',
        soundType: 'chime',
        onClick: openClearNotesModal,
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
        href: savedRoutesHref,
        offset: 3,
    },
    {
        key: 'save',
        label: '保存・更新',
        variant: 'filled',
        color: 'blue',
        onClick: openSaveModal,
    },
];

export const createSaveRoutePayload = (state: RouteState): RouteState => ({
    type: state.type,
    month: state.month,
    day: state.day,
    dateOption: state.dateOption,
    departure: state.departure,
    destination: state.destination,
    routes: state.routes,
    notes: state.notes,
});

export const createUpdateRoutePayload = (state: RouteState): Partial<RouteState> => ({
    type: state.type,
    month: state.month,
    day: state.day,
    dateOption: state.dateOption,
    departure: state.departure,
    destination: state.destination,
    routes: state.routes,
    notes: state.notes,
});

export const createSaveLabels = (routes: SavedRouteState[]): Array<{ value: string; label: string }> =>
    routes.map((route) => ({
        value: route.id,
        label: `${route.route.departure} → ${route.route.destination} / ID: ${route.id}`,
    }));

export const isSameCalendarDate = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

export type { ControlButtonDefinition };
