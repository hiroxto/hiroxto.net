import { describe, expect, test } from 'vitest';
import {
    createSaveLabels,
    createSaveRoutePayload,
    createUpdateRoutePayload,
    isSameCalendarDate,
} from '@/components/fare-ticket-route-planner/control-buttons-ui';
import type { SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

describe('control buttons ui', () => {
    test('新規保存用のデータに現在の経路設定を含める', () => {
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
            notes: 'テスト用の備考',
        });

        expect(payload).toEqual({
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
            notes: 'テスト用の備考',
        });
    });

    test('更新用のデータに現在の経路設定を含める', () => {
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
            notes: 'テスト用の備考',
        });

        expect(payload).toEqual({
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
            notes: 'テスト用の備考',
        });
    });

    test('保存済み経路の表示名に発駅・着駅・ID を含める', () => {
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

    test('時刻が違っても同じ日付なら一致し、同じ曜日でも別の日付なら一致しない', () => {
        expect(isSameCalendarDate(new Date('2026-03-17T09:00:00+09:00'), new Date('2026-03-17T18:00:00+09:00'))).toBe(
            true,
        );
        expect(isSameCalendarDate(new Date('2026-03-17T09:00:00+09:00'), new Date('2026-03-24T09:00:00+09:00'))).toBe(
            false,
        );
    });
});
