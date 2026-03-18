import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRouteStateStore } from './route-state-store';

describe('useRouteStateStore', () => {
    beforeEach(() => {
        useRouteStateStore.setState({
            type: '片道乗車券',
            month: '',
            day: '',
            dateOption: 'use',
            departure: '',
            destination: '',
            routes: [{ id: 'initial', line: '', station: '' }],
            notes: '',
        });
    });

    test('経路を追加・更新・削除できる', () => {
        useRouteStateStore.getState().addRoute(-1);
        useRouteStateStore.getState().updateLine(0, '東海道線');
        useRouteStateStore.getState().updateStation(0, '東京');
        useRouteStateStore.getState().deleteRoute(1);

        const state = useRouteStateStore.getState();
        expect(state.routes).toHaveLength(1);
        expect(state.routes[0]).toMatchObject({ line: '東海道線', station: '東京' });
    });

    test('空経路クリアで値のある経路だけ残す', () => {
        useRouteStateStore.setState({
            routes: [
                { id: '1', line: '', station: '' },
                { id: '2', line: '東海道線', station: '東京' },
            ],
        });

        useRouteStateStore.getState().deleteEmptyRoutes();

        expect(useRouteStateStore.getState().routes).toEqual([{ id: '2', line: '東海道線', station: '東京' }]);
    });

    test('発着逆転で経路も逆順に組み替える', () => {
        useRouteStateStore.setState({
            departure: '東京',
            destination: '博多',
            routes: [
                { id: '1', line: '東海道線', station: '名古屋' },
                { id: '2', line: '山陽線', station: '' },
            ],
        });

        useRouteStateStore.getState().reverse();

        const state = useRouteStateStore.getState();
        expect(state.departure).toBe('博多');
        expect(state.destination).toBe('東京');
        expect(state.routes).toEqual([
            { id: '2', line: '山陽線', station: '名古屋' },
            { id: '1', line: '東海道線', station: '' },
        ]);
    });

    test('日付ショートカットで月日を設定する', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 10, 12, 0, 0));

        useRouteStateStore.getState().setDateWithIndex(2);

        const state = useRouteStateStore.getState();
        expect(state.dateOption).toBe('use');
        expect(state.month).toBe('3');
        expect(state.day).toBe('12');

        vi.useRealTimers();
    });

    test('全経路クリアで1行だけ残す', () => {
        useRouteStateStore.setState({
            routes: [
                { id: '1', line: '東海道線', station: '東京' },
                { id: '2', line: '山陽線', station: '' },
            ],
        });

        useRouteStateStore.getState().deleteAllRoutes();

        expect(useRouteStateStore.getState().routes).toHaveLength(1);
        expect(useRouteStateStore.getState().routes[0]?.line).toBe('');
    });
});
