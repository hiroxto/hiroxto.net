import { describe, expect, test, vi } from 'vitest';
import {
    createBaseGrayButtonDefinitions,
    createSaveLabels,
    createSaveRoutePayload,
    createSecondaryButtonDefinitions,
    createUpdateRoutePayload,
    isSameCalendarDate,
} from '@/components/fare-ticket-route-planner/control-buttons-ui';
import type { SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

describe('control buttons ui', () => {
    test('基本ボタンが対応するハンドラーを呼び出すこと', () => {
        const setDateWithIndex = vi.fn();
        const openCalendarModal = vi.fn();
        const reverse = vi.fn();
        const addRoute = vi.fn();

        const buttons = createBaseGrayButtonDefinitions({
            setDateWithIndex,
            openCalendarModal,
            reverse,
            addRoute,
        });

        buttons.find((button) => button.key === 'today')?.onClick?.();
        expect(setDateWithIndex).toHaveBeenCalledWith(0);

        buttons.find((button) => button.key === 'calendar')?.onClick?.();
        expect(openCalendarModal).toHaveBeenCalled();

        buttons.find((button) => button.key === 'reverse')?.onClick?.();
        expect(reverse).toHaveBeenCalled();

        buttons.find((button) => button.key === 'add-route')?.onClick?.();
        expect(addRoute).toHaveBeenCalledWith(-1);
    });

    test('補助ボタンで補完切替とリンク設定ができること', () => {
        const deleteEmptyRoutes = vi.fn();
        const openClearSettingModal = vi.fn();
        const openClearAllRoutesModal = vi.fn();
        const openClearNotesModal = vi.fn();
        const enableComplete = vi.fn();
        const disableComplete = vi.fn();

        const buttons = createSecondaryButtonDefinitions({
            deleteEmptyRoutes,
            openClearSettingModal,
            openClearAllRoutesModal,
            openClearNotesModal,
            useComplete: true,
            enableComplete,
            disableComplete,
            savedRoutesHref: '/tools/fare-ticket-route-planner/states',
            openSaveModal: vi.fn(),
        });

        buttons.find((button) => button.key === 'delete-empty-routes')?.onClick?.();
        expect(deleteEmptyRoutes).toHaveBeenCalled();

        buttons.find((button) => button.key === 'clear-setting')?.onClick?.();
        expect(openClearSettingModal).toHaveBeenCalled();

        buttons.find((button) => button.key === 'toggle-complete')?.onClick?.();
        expect(disableComplete).toHaveBeenCalled();
        expect(enableComplete).not.toHaveBeenCalled();

        expect(buttons.find((button) => button.key === 'saved-routes')?.href).toBe(
            '/tools/fare-ticket-route-planner/states',
        );
        expect(buttons.find((button) => button.key === 'delete-empty-routes')?.label).toBe('空経路\nクリア');
        expect(buttons.find((button) => button.key === 'clear-all-routes')?.label).toBe('全経路\nクリア');
    });

    test('保存用ペイロード生成時に現在の経路状態をそのまま返すこと', () => {
        const payload = createSaveRoutePayload({
            type: '片道乗車券',
            month: '1',
            day: '2',
            dateOption: 'skip',
            departure: '東京',
            destination: '尼崎',
            routes: [
                { id: 'route-1', line: '新幹線', station: '新大阪' },
                { id: 'route-2', line: '東海道線', station: '' },
            ],
            notes: 'テストnotes',
        });

        expect(payload).toMatchObject({
            type: '片道乗車券',
            month: '1',
            day: '2',
            dateOption: 'skip',
            departure: '東京',
            destination: '尼崎',
            routes: [
                { id: 'route-1', line: '新幹線', station: '新大阪' },
                { id: 'route-2', line: '東海道線', station: '' },
            ],
            notes: 'テストnotes',
        });
    });

    test('更新用ペイロードが必要最小限のスナップショットを返すこと', () => {
        const payload = createUpdateRoutePayload({
            type: '片道乗車券',
            month: '1',
            day: '2',
            dateOption: 'skip',
            departure: '東京',
            destination: '尼崎',
            routes: [
                { id: 'route-1', line: '新幹線', station: '新大阪' },
                { id: 'route-2', line: '東海道線', station: '' },
            ],
            notes: 'テストnotes',
        });

        expect(payload).toMatchObject({
            type: '片道乗車券',
            month: '1',
            day: '2',
            dateOption: 'skip',
            departure: '東京',
            destination: '尼崎',
            routes: [
                { id: 'route-1', line: '新幹線', station: '新大阪' },
                { id: 'route-2', line: '東海道線', station: '' },
            ],
            notes: 'テストnotes',
        });
    });

    test('保存ラベルが東京から尼崎の経路文字列になること', () => {
        const savedRoutes: SavedRouteState[] = [
            {
                id: 'route-id',
                createdAtTs: 1,
                route: {
                    type: '片道乗車券',
                    month: '1',
                    day: '2',
                    dateOption: 'use',
                    departure: '東京',
                    destination: '尼崎',
                    routes: [],
                    notes: '',
                },
            },
        ];

        const labels = createSaveLabels(savedRoutes);

        expect(labels).toEqual([{ value: 'route-id', label: '東京 → 尼崎 / ID: route-id' }]);
    });

    test('同一カレンダー日付を曜日ではなく日付で比較すること', () => {
        expect(isSameCalendarDate(new Date('2026-03-17T09:00:00+09:00'), new Date('2026-03-17T18:00:00+09:00'))).toBe(
            true,
        );
        expect(isSameCalendarDate(new Date('2026-03-17T09:00:00+09:00'), new Date('2026-03-24T09:00:00+09:00'))).toBe(
            false,
        );
    });
});
