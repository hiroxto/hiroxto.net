import { describe, expect, it, vi } from 'vitest';
import { calculateFareBetweenStations, searchRoutes } from './search';

describe('calculateFareBetweenStations', () => {
    it('渋谷から浅草は運賃計算キロ程13.1kmの距離帯運賃になる', () => {
        // 旅客営業規程の別表第1号表と第13条から独立して求めた最短キロ程は13.1km。
        // 14kmへ切り上げられるため、12〜19km帯のIC252円・きっぷ260円。
        expect(calculateFareBetweenStations('shibuya', 'asakusa')).toEqual({
            shortestDistanceTenths: 131,
            ic: 252,
            ticket: 260,
        });
    });

    it('綾瀬と北千住の相互発着には2026年3月14日改定の特殊運賃を適用する', () => {
        // 第13条の運賃計算キロ程は2.5kmだが、距離帯運賃ではなく相互発着限定の特殊運賃を使う。
        // 2026年3月14日改定後の公式運賃はIC155円・きっぷ160円。
        expect(calculateFareBetweenStations('ayase', 'kita-senju')).toEqual({
            shortestDistanceTenths: 25,
            ic: 155,
            ticket: 160,
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
            shortestDistanceTenths: 60,
            ic: 178,
            ticket: 180,
        },
        {
            name: '溜池山王から恵比寿',
            originStationId: 'tameike-sanno',
            destinationStationId: 'ebisu',
            shortestDistanceTenths: 58,
            ic: 178,
            ticket: 180,
        },
        {
            name: '渋谷から木場',
            originStationId: 'shibuya',
            destinationStationId: 'kiba',
            shortestDistanceTenths: 111,
            ic: 252,
            ticket: 260,
        },
        {
            name: '恵比寿から氷川台',
            originStationId: 'ebisu',
            destinationStationId: 'hikawadai',
            shortestDistanceTenths: 192,
            ic: 293,
            ticket: 300,
        },
        {
            name: '赤坂から江戸川橋',
            originStationId: 'akasaka',
            destinationStationId: 'edogawabashi',
            shortestDistanceTenths: 62,
            ic: 209,
            ticket: 210,
        },
        {
            name: '押上から和光市',
            originStationId: 'oshiage',
            destinationStationId: 'wakoshi',
            shortestDistanceTenths: 271,
            ic: 324,
            ticket: 330,
        },
    ] as const)(
        '$nameは第13条の運賃計算キロ程に対応する境界付近の運賃になる',
        ({ originStationId, destinationStationId, shortestDistanceTenths, ic, ticket }) => {
            expect(calculateFareBetweenStations(originStationId, destinationStationId)).toEqual({
                shortestDistanceTenths,
                ic,
                ticket,
            });
        },
    );

    it.each([
        ['綾瀬―北千住', 'ayase', 'kita-senju', 25],
        ['日比谷―霞ケ関', 'hibiya', 'kasumigaseki', 12],
        ['霞ケ関―国会議事堂前', 'kasumigaseki', 'kokkai-gijidomae', 7],
        ['青山一丁目―永田町', 'aoyama-itchome', 'nagatacho', 13],
        ['小竹向原―千川', 'kotake-mukaihara', 'senkawa', 10],
        ['要町―池袋', 'kanamecho', 'ikebukuro', 12],
        ['溜池山王―虎ノ門', 'tameike-sanno', 'toranomon', 6],
        ['赤坂見附―溜池山王', 'akasaka-mitsuke', 'tameike-sanno', 9],
        ['溜池山王―永田町', 'tameike-sanno', 'nagatacho', 9],
        ['永田町―四ツ谷', 'nagatacho', 'yotsuya', 13],
        ['渋谷―表参道', 'shibuya', 'omote-sando', 13],
    ] as const)('%sは旅客営業規程第13条の運賃計算キロ程になる', (_name, origin, destination, distance) => {
        expect(calculateFareBetweenStations(origin, destination).shortestDistanceTenths).toBe(distance);
    });
});

describe('searchRoutes', () => {
    it('桜田門から浅草は路線を再利用する改札外乗換14回の候補を返す', () => {
        // 改札外乗換14か所をすべて通る片道経路がある。
        const { routes } = searchRoutes('sakuradamon', 'asakusa');
        const firstRouteLineIds = routes[0].legs.map((leg) => leg.lineId);

        expect(routes.length).toBeGreaterThan(0);
        expect(routes.length).toBeLessThanOrEqual(20);
        expect(routes.every((route) => route.outsideTransferCount === 14)).toBe(true);
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

    it('経路の運賃と表示距離にも第13条の運賃計算キロ程を適用する', () => {
        const { routes } = searchRoutes('shibuya', 'shimbashi', 1);
        const route = routes.find((candidate) =>
            candidate.transfers.some(
                (transfer) => transfer.fromStationId === 'toranomon' && transfer.toStationId === 'toranomon-hills',
            ),
        );

        expect(route).toBeDefined();
        expect(route?.shortestDistanceTenths).toBe(60);
        expect(route?.fare).toEqual({ ic: 178, ticket: 180 });
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
    }, 10_000);

    it('未指定検索は探索困難な発着駅でも時間上限内に打ち切り状態を返す', () => {
        const result = searchRoutes('honancho', 'kita-ayase');

        expect(result.truncated).toBe(true);
    }, 10_000);

    it('推定最大回数の探索を打ち切っても低い乗換回数の候補を返す', () => {
        const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(5_000);
        performanceNowSpy.mockReturnValueOnce(0);

        const result = searchRoutes('kita-ayase', 'nishi-funabashi');
        performanceNowSpy.mockRestore();

        expect(result.truncated).toBe(true);
        expect(result.routes).toHaveLength(20);
        expect(result.routes.every((route) => route.outsideTransferCount === 1)).toBe(true);
    }, 10_000);
});
