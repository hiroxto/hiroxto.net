import { describe, expect, it, vi } from 'vitest';

// 駅IDだけを借りた検証用グラフ。距離・路線は実際の路線網を表さない。
// A=東京、B=大手町、C=三越前、D=浅草、E=上野、F=銀座。
// M: A--6--B--30--D / Z: B--7--C--20--D / G: A--4--E--8--C--5--F--10--D
// Bでは改札内・外の両方、Cでは改札外だけで乗換可能。
vi.mock('@/lib/tokyometro-core/data', () => ({
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

    it('改札内乗換を無効にすると改札外乗換だけの2経路を返す', () => {
        const result = searchRoutes('tokyo', 'asakusa', 1, { includeInsideTransfers: false });
        expect(result.truncated).toBe(false);
        expect(
            result.routes.map((route) => ({
                inside: route.insideTransferCount,
                distance: route.actualDistanceTenths,
                stops: route.legs.map((leg) => leg.toStationId),
            })),
        ).toEqual([
            { inside: 0, distance: 32, stops: ['mitsukoshimae', 'asakusa'] },
            { inside: 0, distance: 33, stops: ['otemachi', 'asakusa'] },
        ]);
    });

    it('三越前だけを選択しても大手町での改札内乗換を許可する', () => {
        const result = searchRoutes('tokyo', 'asakusa', null, { outsideTransferIds: ['mitsukoshimae'] });
        expect(result.truncated).toBe(false);
        expect(
            result.routes.map((route) => ({
                inside: route.insideTransferCount,
                distance: route.actualDistanceTenths,
                stops: route.legs.map((leg) => leg.toStationId),
            })),
        ).toEqual([
            { inside: 0, distance: 32, stops: ['mitsukoshimae', 'asakusa'] },
            { inside: 1, distance: 28, stops: ['otemachi', 'mitsukoshimae', 'asakusa'] },
            { inside: 1, distance: 49, stops: ['mitsukoshimae', 'otemachi', 'asakusa'] },
        ]);
    });

    it('大手町だけを選択しても未選択の三越前を列車で通過できる', () => {
        // MのA→B(0.6km)、ZのB→C→D(2.7km)。Cで乗り換えず通過する。
        const result = searchRoutes('tokyo', 'asakusa', null, {
            outsideTransferIds: ['otemachi'],
            includeInsideTransfers: false,
        });
        expect(result.truncated).toBe(false);
        expect(result.routes).toHaveLength(1);
        expect(result.routes[0]).toMatchObject({
            actualDistanceTenths: 33,
            legs: [
                { lineId: 'marunouchi', fromStationId: 'tokyo', toStationId: 'otemachi' },
                { lineId: 'hanzomon', fromStationId: 'otemachi', toStationId: 'asakusa' },
            ],
        });
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

describe('必須改札外乗換を満たす探索', () => {
    it('大手町を必須にすると通過・改札内だけの経路を除いて順位を付ける', () => {
        const result = searchRoutes('tokyo', 'asakusa', 1, { requiredOutsideTransferIds: ['otemachi'] });
        expect(result.truncated).toBe(false);
        expect(
            result.routes.map((route) => ({
                distance: route.actualDistanceTenths,
                outside: route.transfers
                    .filter((transfer) => transfer.type === 'outside')
                    .map((transfer) => transfer.fromStationId),
            })),
        ).toEqual([{ distance: 33, outside: ['otemachi'] }]);
    });
    it('複数の必須地点はすべて実際に改札外乗換する', () => {
        const result = searchRoutes('tokyo', 'asakusa', null, {
            requiredOutsideTransferIds: ['otemachi', 'mitsukoshimae'],
        });
        expect(result.truncated).toBe(false);
        expect(
            result.routes.map((route) => route.transfers.map((transfer) => [transfer.fromStationId, transfer.type])),
        ).toEqual([
            [
                ['otemachi', 'outside'],
                ['mitsukoshimae', 'outside'],
            ],
            [
                ['mitsukoshimae', 'outside'],
                ['otemachi', 'outside'],
            ],
        ]);
    });
    it('必須地点が発駅なら経路なしを確定する', () => {
        expect(searchRoutes('otemachi', 'asakusa', null, { requiredOutsideTransferIds: ['otemachi'] })).toEqual({
            routes: [],
            truncated: false,
            outsideTransferUpperBound: 0,
        });
    });
    it.each([{ visitLimit: 0 }, { durationLimitMs: 0 }])('予算%sで未発見の場合は不存在とせず未確定を返す', (budget) => {
        expect(searchRoutes('tokyo', 'asakusa', 1, { requiredOutsideTransferIds: ['otemachi'], ...budget })).toEqual({
            routes: [],
            truncated: true,
            outsideTransferUpperBound: 1,
        });
    });
    it('必須地点の明示的な空配列は既存の探索結果を変えない', () => {
        expect(searchRoutes('tokyo', 'asakusa', 1, { requiredOutsideTransferIds: [] })).toEqual(
            searchRoutes('tokyo', 'asakusa', 1),
        );
    });
    it('利用許可以外の必須地点は入力エラーにする', () => {
        expect(() =>
            searchRoutes('tokyo', 'asakusa', null, {
                outsideTransferIds: ['mitsukoshimae'],
                requiredOutsideTransferIds: ['otemachi'],
            }),
        ).toThrow('必須の改札外乗換駅は「利用する改札外乗換駅」でも選択してください');
    });
    it('最大回数より多い必須地点は入力エラーにする', () => {
        expect(() =>
            searchRoutes('tokyo', 'asakusa', 1, { requiredOutsideTransferIds: ['otemachi', 'mitsukoshimae'] }),
        ).toThrow('必須の改札外乗換駅の数が最大回数を超えています。最大回数を増やすか必須駅を減らしてください');
    });
});
