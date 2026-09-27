import { describe, expect, it, vi } from 'vitest';

// 実際の路線網とは異なる検証用グラフ。距離は0.1km単位。
// M: A--2--B--4--C--5--D、C--7--X / G: E--3--F--6--H
// 改札外乗換: B↔E、C↔F。A=東京、B=大手町、C=三越前、D=浅草、
// E=上野、F=銀座、H=渋谷、X=新宿。
vi.mock('./data', () => ({
    STATION_NAMES: {
        tokyo: 'A',
        otemachi: 'B',
        mitsukoshimae: 'C',
        asakusa: 'D',
        ueno: 'E',
        ginza: 'F',
        shibuya: 'H',
        shinjuku: 'X',
    },
    LINE_DEFINITIONS: { marunouchi: { name: 'M' }, ginza: { name: 'G' } },
    LINE_PATHS: [
        {
            lineId: 'marunouchi',
            stations: [
                ['tokyo', 0],
                ['otemachi', 2],
                ['mitsukoshimae', 4],
                ['asakusa', 5],
            ],
        },
        {
            lineId: 'marunouchi',
            stations: [
                ['mitsukoshimae', 0],
                ['shinjuku', 7],
            ],
        },
        {
            lineId: 'ginza',
            stations: [
                ['ueno', 0],
                ['ginza', 3],
                ['shibuya', 6],
            ],
        },
    ],
    CROSS_STATION_TRANSFERS: [
        { fromStationId: 'otemachi', toStationId: 'ueno', linePairs: [['marunouchi', 'ginza']], type: 'outside' },
        { fromStationId: 'mitsukoshimae', toStationId: 'ginza', linePairs: [['marunouchi', 'ginza']], type: 'outside' },
    ],
    FARE_CALCULATION_DISTANCE_OVERRIDES: [],
    SAME_STATION_OUTSIDE_TRANSFERS: [],
    SAME_STATION_INSIDE_AND_OUTSIDE_TRANSFERS: [],
}));

import { searchRoutes } from './search';

describe('異駅名乗換と分岐を含む小規模グラフ', () => {
    it.each([
        {
            from: 'tokyo',
            to: 'asakusa',
            distance: 10,
            legs: [
                ['tokyo', 'otemachi'],
                ['ueno', 'ginza'],
                ['mitsukoshimae', 'asakusa'],
            ],
            transfers: [
                ['otemachi', 'ueno'],
                ['ginza', 'mitsukoshimae'],
            ],
        },
        {
            from: 'asakusa',
            to: 'tokyo',
            distance: 10,
            legs: [
                ['asakusa', 'mitsukoshimae'],
                ['ginza', 'ueno'],
                ['otemachi', 'tokyo'],
            ],
            transfers: [
                ['mitsukoshimae', 'ginza'],
                ['ueno', 'otemachi'],
            ],
        },
        {
            from: 'tokyo',
            to: 'shinjuku',
            distance: 12,
            legs: [
                ['tokyo', 'otemachi'],
                ['ueno', 'ginza'],
                ['mitsukoshimae', 'shinjuku'],
            ],
            transfers: [
                ['otemachi', 'ueno'],
                ['ginza', 'mitsukoshimae'],
            ],
        },
    ] as const)('$fromから$toは異駅名乗換を2回使う唯一の経路を返す', ({ from, to, distance, legs, transfers }) => {
        const result = searchRoutes(from, to);
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(2);
        expect(result.routes).toHaveLength(1);
        const route = result.routes[0];
        expect(route.outsideTransferCount).toBe(2);
        expect(route.insideTransferCount).toBe(0);
        expect(route.actualDistanceTenths).toBe(distance);
        expect(route.legs.map((leg) => [leg.fromStationId, leg.toStationId])).toEqual(legs);
        expect(route.legs.map((leg) => leg.lineId)).toEqual(['marunouchi', 'ginza', 'marunouchi']);
        expect(route.transfers.map((transfer) => [transfer.fromStationId, transfer.toStationId])).toEqual(transfers);
    });

    it('2地点に到達可能でも両方使うと着駅へ行けない場合は1回の全2経路を距離順に返す', () => {
        // A→B、E→H は2+3+6=11。A→C、F→H は2+4+6=12。
        // 二つの乗換を使うとMへ戻るため、G上のHに到着できない。
        const result = searchRoutes('tokyo', 'shibuya');
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(1);
        expect(
            result.routes.map((route) => ({
                outside: route.outsideTransferCount,
                inside: route.insideTransferCount,
                distance: route.actualDistanceTenths,
                legs: route.legs.map((leg) => [leg.fromStationId, leg.toStationId]),
            })),
        ).toEqual([
            {
                outside: 1,
                inside: 0,
                distance: 11,
                legs: [
                    ['tokyo', 'otemachi'],
                    ['ueno', 'shibuya'],
                ],
            },
            {
                outside: 1,
                inside: 0,
                distance: 12,
                legs: [
                    ['tokyo', 'mitsukoshimae'],
                    ['ginza', 'shibuya'],
                ],
            },
        ]);
    });

    it('同一路線の発着で改札外乗換の上限が1回の場合は経路が存在しないと確定する', () => {
        expect(searchRoutes('tokyo', 'asakusa', 1)).toEqual({
            routes: [],
            truncated: false,
            outsideTransferUpperBound: 0,
        });
    });

    it('着駅へ徒歩乗換して終了する候補を除外し、別の乗換から乗車して着く経路を残す', () => {
        // B→Eの徒歩で終わる候補は対象外。A→C、F→Eの距離は2+4+3=9。
        const result = searchRoutes('tokyo', 'ueno');
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(1);
        expect(result.routes).toHaveLength(1);
        expect(result.routes[0]).toMatchObject({
            outsideTransferCount: 1,
            insideTransferCount: 0,
            actualDistanceTenths: 9,
            legs: [
                { fromStationId: 'tokyo', toStationId: 'mitsukoshimae', lineId: 'marunouchi' },
                { fromStationId: 'ginza', toStationId: 'ueno', lineId: 'ginza' },
            ],
            transfers: [{ fromStationId: 'mitsukoshimae', toStationId: 'ginza', type: 'outside' }],
        });
    });
});
