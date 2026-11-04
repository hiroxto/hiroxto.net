import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRouteStateStore } from './route-state-store';

describe('useRouteStateStore', () => {
    beforeEach(() => {
        useRouteStateStore.setState({
            month: '',
            day: '',
            dateOption: 'use',
            departure: '',
            destination: '',
            routes: [{ id: 'initial', line: '', station: '' }],
            notes: '',
            past: [],
            future: [],
            editGroup: null,
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

    test('空経路クリア後は値のある経路だけ残る', () => {
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

    test('全経路クリア後は路線名が空の経路を1行だけ残す', () => {
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

describe('経路編集の履歴', () => {
    beforeEach(() => {
        useRouteStateStore.setState({
            month: '',
            day: '',
            dateOption: 'use',
            departure: '',
            destination: '',
            routes: [{ id: 'one', line: '', station: '' }],
            notes: '',
            past: [],
            future: [],
            editGroup: null,
        });
    });
    test('同じ欄の連続入力を一度で戻し、確定後の入力は別操作として戻す', () => {
        const store = useRouteStateStore.getState;
        store().setDeparture('東');
        store().setDeparture('東京');
        store().finishEditing();
        store().setDeparture('東京駅');
        store().undo();
        expect(store().departure).toBe('東京');
        store().undo();
        expect(store().departure).toBe('');
        store().redo();
        expect(store().departure).toBe('東京');
        store().redo();
        expect(store().departure).toBe('東京駅');
    });
    test('読み込みと逆転を戻すと日付・備考・発着・経路をまとめて復元する', () => {
        const store = useRouteStateStore.getState;
        const loaded = {
            month: '11',
            day: '5',
            dateOption: 'skip' as const,
            departure: '東京',
            destination: '博多',
            routes: [{ id: 'saved', line: '新幹線', station: '' }],
            notes: '保存した備考',
        };
        store().reconstruct(loaded);
        store().reverse();
        store().undo();
        expect(store()).toMatchObject(loaded);
        store().undo();
        expect(store()).toMatchObject({
            month: '',
            day: '',
            dateOption: 'use',
            departure: '',
            destination: '',
            notes: '',
            routes: [{ id: 'one', line: '', station: '' }],
        });
        store().redo();
        expect(store()).toMatchObject(loaded);
        store().redo();
        expect(store()).toMatchObject({ ...loaded, departure: '博多', destination: '東京' });
    });
    test('同値の変更は履歴を増やさずRedoを残し、新しい変更でRedoを破棄する', () => {
        const store = useRouteStateStore.getState;
        store().setNotes('備考');
        store().addRoute(-1);
        store().undo();
        store().setNotes('備考');
        expect(store().past).toHaveLength(1);
        expect(store().future).toHaveLength(1);
        store().setDestination('大阪');
        expect(store().future).toHaveLength(0);
        store().redo();
        expect(store().destination).toBe('大阪');
    });
    test('行の追加・編集・削除を順に戻し直せる', () => {
        const store = useRouteStateStore.getState;
        store().addRoute(-1);
        store().updateLine(1, '東海');
        store().updateLine(1, '東海道線');
        store().deleteRoute(1);
        store().undo();
        expect(store().routes[1]?.line).toBe('東海道線');
        store().undo();
        expect(store().routes[1]?.line).toBe('');
        store().undo();
        expect(store().routes).toHaveLength(1);
        store().redo();
        store().redo();
        store().redo();
        expect(store().routes).toHaveLength(1);
    });
    test('日付の一括指定と日付省略をそれぞれ一操作で戻す', () => {
        const store = useRouteStateStore.getState;
        store().setCalendarDate('12', '31');
        store().skipDate();
        store().undo();
        expect(store()).toMatchObject({ month: '12', day: '31', dateOption: 'use' });
        store().undo();
        expect(store()).toMatchObject({ month: '', day: '', dateOption: 'use' });
        store().redo();
        store().redo();
        expect(store()).toMatchObject({ month: '', day: '', dateOption: 'skip' });
    });
    test('空の設定と経路をクリアしても戻す操作を追加しない', () => {
        const store = useRouteStateStore.getState;
        store().deleteAllRoutes();
        store().deleteEmptyRoutes();
        store().clearSetting();
        store().resetNotes();
        expect(store().past).toEqual([]);
        expect(store().routes).toEqual([{ id: 'one', line: '', station: '' }]);
    });
    test('保存するのは現在の入力だけで履歴は保存しない', async () => {
        const store = useRouteStateStore.getState;
        store().setNotes('保存する備考');
        const persisted = JSON.parse(window.localStorage.getItem('route-state') ?? '{}');
        expect(persisted.state).toEqual({
            month: '',
            day: '',
            dateOption: 'use',
            departure: '',
            destination: '',
            routes: [{ id: 'one', line: '', station: '' }],
            notes: '保存する備考',
        });
        await useRouteStateStore.persist.rehydrate();
        expect(store().past).toEqual([]);
        expect(store().future).toEqual([]);
    });
});
