import { describe, expect, it } from 'vitest';
import { calculateFareBetweenStations, searchRoutes } from './search';

describe('calculateFareBetweenStations', () => {
    it('渋谷から浅草は最短13.0kmの距離帯運賃になる', () => {
        // 旅客営業規程の別表第1号表から独立して求めた最短営業キロは13.0km。
        // 13kmは12〜19km帯なので、IC252円・きっぷ260円。
        expect(calculateFareBetweenStations('shibuya', 'asakusa')).toEqual({
            shortestDistanceTenths: 130,
            ic: 252,
            ticket: 260,
        });
    });

    it('綾瀬と北千住の相互発着には2026年3月14日改定の特殊運賃を適用する', () => {
        // 営業キロは2.6kmだが、距離帯運賃ではなく相互発着限定の特殊運賃を使う。
        // 2026年3月14日改定後の公式運賃はIC146円・きっぷ150円。
        expect(calculateFareBetweenStations('ayase', 'kita-senju')).toEqual({
            shortestDistanceTenths: 26,
            ic: 146,
            ticket: 150,
        });
    });

    it('目黒と白金高輪の相互発着には共用区間の運賃を適用する', () => {
        // 南北線の目黒―白金台1.3 + 白金台―白金高輪1.0 = 2.3km。
        // 共用区間の公式運賃はIC178円・きっぷ180円。
        expect(calculateFareBetweenStations('meguro', 'shirokane-takanawa')).toEqual({
            shortestDistanceTenths: 23,
            ic: 178,
            ticket: 180,
        });
    });

    it.each([
        {
            name: '渋谷から新橋',
            originStationId: 'shibuya',
            destinationStationId: 'shimbashi',
            shortestDistanceTenths: 61,
            ic: 209,
            ticket: 210,
        },
        {
            name: '溜池山王から恵比寿',
            originStationId: 'tameike-sanno',
            destinationStationId: 'ebisu',
            shortestDistanceTenths: 60,
            ic: 178,
            ticket: 180,
        },
        {
            name: '渋谷から木場',
            originStationId: 'shibuya',
            destinationStationId: 'kiba',
            shortestDistanceTenths: 110,
            ic: 209,
            ticket: 210,
        },
        {
            name: '恵比寿から氷川台',
            originStationId: 'ebisu',
            destinationStationId: 'hikawadai',
            shortestDistanceTenths: 189,
            ic: 252,
            ticket: 260,
        },
    ] as const)(
        '$nameは修正後の最短営業キロに対応する境界付近の運賃になる',
        ({ originStationId, destinationStationId, shortestDistanceTenths, ic, ticket }) => {
            expect(calculateFareBetweenStations(originStationId, destinationStationId)).toEqual({
                shortestDistanceTenths,
                ic,
                ticket,
            });
        },
    );
});

describe('searchRoutes', () => {
    it('桜田門から浅草は路線を再利用する改札外乗換14回の上位20経路を返す', () => {
        // 改札外乗換14か所をすべて通る片道経路があり、その最上位経路の改札内乗換は3回。
        const { routes } = searchRoutes('sakuradamon', 'asakusa');
        const firstRouteLineIds = routes[0].legs.map((leg) => leg.lineId);

        expect(routes).toHaveLength(20);
        expect(routes.every((route) => route.outsideTransferCount === 14)).toBe(true);
        expect(routes[0]).toMatchObject({
            outsideTransferCount: 14,
            insideTransferCount: 3,
        });
        expect(new Set(firstRouteLineIds).size).toBeLessThan(firstRouteLineIds.length);
    }, 10_000);

    it('最大改札外乗換回数を3回にすると改札外乗換3回の上位20経路を返す', () => {
        const { routes } = searchRoutes('sakuradamon', 'asakusa', 3);

        expect(routes).toHaveLength(20);
        expect(routes.every((route) => route.outsideTransferCount === 3)).toBe(true);
    });

    it('最大改札外乗換回数を1回にしても改札内乗換は1回に制限しない', () => {
        const { routes } = searchRoutes('sakuradamon', 'asakusa', 1);

        expect(routes.every((route) => route.outsideTransferCount === 1)).toBe(true);
        expect(routes.some((route) => route.insideTransferCount > 1)).toBe(true);
    });

    it('乗車駅と降車駅が同じ場合は経路を返さない', () => {
        // 片道経路は異なる発着駅を前提とするため、同駅指定の期待件数は0件。
        expect(searchRoutes('ginza', 'ginza')).toEqual({ routes: [], truncated: false });
    });

    it('出発駅を再訪しないと到達できない場合は経路を返さない', () => {
        // 北綾瀬へは綾瀬を経由する必要があるため、綾瀬発の片道経路では改札外乗換を挟めない。
        expect(searchRoutes('ayase', 'kita-ayase')).toEqual({ routes: [], truncated: false });
    });

    it('未指定検索の探索量が上限に達した場合は見つかった候補と打ち切り状態を返す', () => {
        const result = searchRoutes('wakoshi', 'nishi-funabashi');

        expect(result.truncated).toBe(true);
        expect(result.routes).toHaveLength(20);
        expect(result.routes.every((route) => route.outsideTransferCount === 14)).toBe(true);
    });
});
