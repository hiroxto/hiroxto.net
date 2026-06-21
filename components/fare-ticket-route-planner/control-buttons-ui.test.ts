import { describe, expect, test } from 'vitest';
import {
    createSaveLabels,
    createSaveRoutePayload,
    createUpdateRoutePayload,
    isSameCalendarDate,
} from '@/components/fare-ticket-route-planner/control-buttons-ui';
import type { SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

describe('control buttons ui', () => {
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
