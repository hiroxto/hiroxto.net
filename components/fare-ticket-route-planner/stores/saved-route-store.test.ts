import { beforeEach, describe, expect, test } from 'vitest';
import type { RouteState } from '@/lib/fare-ticket-route-planner/types';
import { useSavedRouteStore } from './saved-route-store';

const routeState: RouteState = {
    type: '片道乗車券',
    month: '3',
    day: '10',
    dateOption: 'use',
    departure: '東京',
    destination: '博多',
    routes: [
        { id: '1', line: '東海道線', station: '名古屋' },
        { id: '2', line: '山陽線', station: '' },
    ],
    notes: 'テスト',
};

describe('useSavedRouteStore', () => {
    beforeEach(() => {
        useSavedRouteStore.setState({ routes: [] });
    });

    test('新規保存できる', () => {
        useSavedRouteStore.getState().saveRoute(routeState);

        const savedRoutes = useSavedRouteStore.getState().routes;
        expect(savedRoutes).toHaveLength(1);
        expect(savedRoutes[0]?.route).toEqual(routeState);
    });

    test('更新できる', () => {
        useSavedRouteStore.setState({
            routes: [{ id: 'saved', createdAtTs: 1, route: routeState }],
        });

        useSavedRouteStore.getState().updateRoute('saved', { notes: '更新後' });

        expect(useSavedRouteStore.getState().routes[0]?.route.notes).toBe('更新後');
    });

    test('個別削除と一括削除ができる', () => {
        useSavedRouteStore.setState({
            routes: [
                { id: 'saved-1', createdAtTs: 1, route: routeState },
                { id: 'saved-2', createdAtTs: 2, route: { ...routeState, notes: '2件目' } },
            ],
        });

        useSavedRouteStore.getState().deleteRoute('saved-1');
        expect(useSavedRouteStore.getState().routes).toHaveLength(1);

        useSavedRouteStore.getState().bulkDeleteRoute(['saved-2']);
        expect(useSavedRouteStore.getState().routes).toHaveLength(0);
    });
});
