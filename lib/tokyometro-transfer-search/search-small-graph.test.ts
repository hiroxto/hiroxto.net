import { describe, expect, it, vi } from 'vitest';

// 駅IDだけを借りた検証用グラフ。距離・路線は実際の路線網を表さない。
// A=東京、B=大手町、C=三越前、D=浅草、E=上野、F=銀座。
// M: A--6--B--30--D / Z: B--7--C--20--D / G: A--4--E--8--C--5--F--10--D
// Bでは改札内・外の両方、Cでは改札外だけで乗換可能。
vi.mock('./data', () => ({
    STATION_NAMES: { tokyo: 'A', otemachi: 'B', mitsukoshimae: 'C', asakusa: 'D', ueno: 'E', ginza: 'F' },
    LINE_DEFINITIONS: { marunouchi: { name: 'M' }, hanzomon: { name: 'Z' }, ginza: { name: 'G' } },
    LINE_PATHS: [
        {
            lineId: 'marunouchi',
            stations: [
                ['tokyo', 0],
                ['otemachi', 6],
                ['asakusa', 30],
            ],
        },
        {
            lineId: 'hanzomon',
            stations: [
                ['otemachi', 0],
                ['mitsukoshimae', 7],
                ['asakusa', 20],
            ],
        },
        {
            lineId: 'ginza',
            stations: [
                ['tokyo', 0],
                ['ueno', 4],
                ['mitsukoshimae', 8],
                ['ginza', 5],
                ['asakusa', 10],
            ],
        },
    ],
    CROSS_STATION_TRANSFERS: [],
    FARE_CALCULATION_DISTANCE_OVERRIDES: [],
    SAME_STATION_OUTSIDE_TRANSFERS: [
        ['otemachi', 'marunouchi', 'hanzomon'],
        ['mitsukoshimae', 'hanzomon', 'ginza'],
    ],
    SAME_STATION_INSIDE_AND_OUTSIDE_TRANSFERS: [['otemachi', 'marunouchi', 'hanzomon']],
}));

import { searchRoutes } from './search';

describe('小規模グラフの全経路との比較', () => {
    it('上限1回では手で列挙した4経路だけを改札内乗換数と距離で並べる', () => {
        const result = searchRoutes('tokyo', 'asakusa', 1);
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(1);
        expect(
            result.routes.map((route) => ({
                inside: route.insideTransferCount,
                distance: route.actualDistanceTenths,
                stops: route.legs.map((leg) => leg.toStationId),
            })),
        ).toEqual([
            { inside: 0, distance: 32, stops: ['mitsukoshimae', 'asakusa'] },
            { inside: 0, distance: 33, stops: ['otemachi', 'asakusa'] },
            { inside: 1, distance: 28, stops: ['otemachi', 'mitsukoshimae', 'asakusa'] },
            { inside: 1, distance: 49, stops: ['mitsukoshimae', 'otemachi', 'asakusa'] },
        ]);
    });

    it('候補の回数が上限に達した後の打ち切りでは最大回数が確定する', () => {
        const result = searchRoutes('tokyo', 'asakusa', 1, { visitLimit: 5 });
        expect(result.truncated).toBe(true);
        expect(result.routes.length).toBeGreaterThan(0);
        expect(result.outsideTransferUpperBound).toBe(1);
        expect(result.routes[0].outsideTransferCount).toBe(1);
    });

    it('未指定検索では手で列挙した2回の2経路を返し、発駅へ戻る経路を含めない', () => {
        const result = searchRoutes('tokyo', 'asakusa');
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(2);
        expect(
            result.routes.map((route) => ({
                outside: route.outsideTransferCount,
                inside: route.insideTransferCount,
                distance: route.actualDistanceTenths,
                stops: route.legs.map((leg) => leg.toStationId),
            })),
        ).toEqual([
            { outside: 2, inside: 0, distance: 28, stops: ['otemachi', 'mitsukoshimae', 'asakusa'] },
            { outside: 2, inside: 0, distance: 49, stops: ['mitsukoshimae', 'otemachi', 'asakusa'] },
        ]);
    });
});
