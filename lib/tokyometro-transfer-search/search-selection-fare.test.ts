import { describe, expect, it, vi } from 'vitest';

// 実際の路線網とは異なる検証用グラフ。距離は0.1km単位。
// M: A--6--B--30--D / Z: B--7--C--20--D / G: A--20--C--5--D
// A=東京、B=大手町、C=三越前、D=浅草。BとCで改札外乗換が可能。
vi.mock('@/lib/tokyometro-core/data', () => ({
    STATION_NAMES: { tokyo: 'A', otemachi: 'B', mitsukoshimae: 'C', asakusa: 'D' },
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
                ['mitsukoshimae', 20],
                ['asakusa', 5],
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

describe('改札外乗換駅の選択と運賃計算', () => {
    it('未選択の大手町で乗り換える最短経路も運賃計算に使う', () => {
        // 候補はGのA→CとZのC→Dで4.0km。運賃最短はM→Z→Gの6+7+5=1.8km。
        const result = searchRoutes('tokyo', 'asakusa', null, {
            outsideTransferIds: ['mitsukoshimae'],
            includeInsideTransfers: false,
        });
        expect(result.truncated).toBe(false);
        expect(result.routes).toHaveLength(1);
        expect(result.routes[0]).toMatchObject({ actualDistanceTenths: 40, shortestDistanceTenths: 18 });
    });
});
