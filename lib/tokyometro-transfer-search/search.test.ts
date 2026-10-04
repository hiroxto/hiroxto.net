import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LINE_PATHS, type StationId } from './data';
import { calculateFareBetweenStations, searchRoutes } from './search';

describe('calculateFareBetweenStations', () => {
    it.each([
        ['ueno-hirokoji', 'naka-okachimachi', 10],
        ['naka-okachimachi', 'ueno-hirokoji', 10],
        ['ginza', 'ginza-itchome', 9],
        ['ginza-itchome', 'ginza', 9],
    ] as const)('%sから%sは徒歩接続だけでなく列車経由の最短距離で計算する', (origin, destination, distance) => {
        // 上野経由は銀座線0.5 + 日比谷線0.5 = 1.0km。
        // 日比谷・有楽町経由は日比谷線0.4 + 有楽町線0.5 = 0.9km。
        expect(calculateFareBetweenStations(origin, destination)).toEqual({
            shortestDistanceTenths: distance,
            ic: 178,
            ticket: 180,
        });
    });

    it('上野広小路から秋葉原は仲御徒町への徒歩乗換を含む1.0kmで計算する', () => {
        expect(calculateFareBetweenStations('ueno-hirokoji', 'akihabara').shortestDistanceTenths).toBe(10);
    });

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
    beforeEach(() => {
        // 経路の検証は実行環境の速度に依存させず、打ち切りは探索予算で個別に再現する。
        vi.spyOn(performance, 'now').mockReturnValue(0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('東京から浅草の上限1回検索には大手町で改札内乗換する6.4kmの候補を含む', () => {
        // 公式営業キロ: 東京―大手町0.6 + 大手町―三越前0.7 + 三越前―浅草5.1。
        const result = searchRoutes('tokyo', 'asakusa', 1);
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(1);
        expect(result.routes[0]).toMatchObject({
            outsideTransferCount: 1,
            insideTransferCount: 1,
            actualDistanceTenths: 64,
            legs: [
                { fromStationId: 'tokyo', toStationId: 'otemachi', lineId: 'marunouchi' },
                { fromStationId: 'otemachi', toStationId: 'mitsukoshimae', lineId: 'hanzomon' },
                { fromStationId: 'mitsukoshimae', toStationId: 'asakusa', lineId: 'ginza' },
            ],
            transfers: [{ type: 'inside' }, { type: 'outside' }],
        });
    });

    it.each([
        ['honancho', 'kita-ayase'],
        ['kita-ayase', 'honancho'],
    ] as const)(
        '%sから%sは改札外乗換14回の既知の経路を発見する',
        (from, to) => {
            // レビューで確認した駅を再訪しない14回の経路は、両方向で利用できる。
            // 時計を固定した探索は全件並列実行で10秒を超えるため、実時間の期限に余裕を持たせる。
            const result = searchRoutes(from, to);
            expect(result.routes.length).toBeGreaterThan(0);
            expect(result.routes[0].outsideTransferCount).toBe(14);
        },
        30_000,
    );

    it('桜田門から浅草は路線を再利用する改札外乗換14回の候補を返す', () => {
        // 改札外乗換14か所をすべて通る片道経路がある。
        // 時計を固定した探索はCIで約16秒かかるため、実時間のテスト期限には余裕を持たせる。
        const { routes } = searchRoutes('sakuradamon', 'asakusa');
        const firstRouteLineIds = routes[0].legs.map((leg) => leg.lineId);

        expect(routes.length).toBeGreaterThan(0);
        expect(routes.length).toBeLessThanOrEqual(20);
        expect(routes.every((route) => route.outsideTransferCount === 14)).toBe(true);
        expect(new Set(firstRouteLineIds).size).toBeLessThan(firstRouteLineIds.length);
    }, 30_000);

    it('最大改札外乗換回数を3回にすると改札外乗換3回の上位20経路を返す', () => {
        const { routes } = searchRoutes('sakuradamon', 'asakusa', 3);

        expect(routes).toHaveLength(20);
        expect(routes.every((route) => route.outsideTransferCount === 3)).toBe(true);
    });

    it('桜田門から浅草の上限を4回から10回・14回へ増やしても20万訪問で発見した乗換回数を減らさない', () => {
        // レビューの再現例では上限4回・20万訪問で3回の候補を発見できる。
        let previousCount = 3;
        for (const maximum of [4, 10, 14]) {
            const result = searchRoutes('sakuradamon', 'asakusa', maximum, { visitLimit: 200_000 });
            expect(result.routes.length).toBeGreaterThan(0);
            // 上限を緩める前の結果との比較自体が、検証する仕様。
            expect(result.routes[0].outsideTransferCount).toBeGreaterThanOrEqual(previousCount);
            previousCount = result.routes[0].outsideTransferCount;
        }
    }, 10_000);

    it('時間予算を消費しても桜田門から浅草の上限4回で見つけた4回以上の候補を上限10回で保持する', () => {
        // 模擬時計での5秒制限でも2回の探索は全件並列実行で20秒を超えるため、実時間の期限を別に確保する。
        let previousCount = 4;
        for (const maximum of [4, 10]) {
            let now = 0;
            vi.mocked(performance.now).mockImplementation(() => {
                now += 5;
                return now;
            });
            const result = searchRoutes('sakuradamon', 'asakusa', maximum);
            expect(result.routes.length).toBeGreaterThan(0);
            expect(result.routes[0].outsideTransferCount).toBeGreaterThanOrEqual(previousCount);
            expect(result.outsideTransferUpperBound).toBeGreaterThanOrEqual(result.routes[0].outsideTransferCount);
            previousCount = result.routes[0].outsideTransferCount;
        }
    }, 60_000);

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

    it('上野広小路から仲御徒町を最大1回で検索すると上野乗換の表示距離は1.0kmになる', () => {
        const { routes } = searchRoutes('ueno-hirokoji', 'naka-okachimachi', 1);
        const route = routes.find((candidate) =>
            candidate.transfers.some((transfer) => transfer.fromStationId === 'ueno'),
        );

        expect(route).toMatchObject({
            shortestDistanceTenths: 10,
            actualDistanceTenths: 10,
            fare: { ic: 178, ticket: 180 },
        });
    });

    it('表参道から外苑前は途中の改札外出場駅までの運賃を下回らない', () => {
        // 発着間0.7kmは178円だが、池袋8.8km・上野9.6kmまでの収受額は209円。
        const result = searchRoutes('omote-sando', 'gaiemmae');
        expect(result.routes.length).toBeGreaterThan(0);
        for (const route of result.routes) {
            expect(route.outsideTransferCount).toBe(14);
            expect(route.shortestDistanceTenths).toBe(7);
            expect(route.fare).toEqual({ ic: 209, ticket: 210 });
            expect(route.fareCheckpoints).toContainEqual({
                stationId: 'ikebukuro',
                shortestDistanceTenths: 88,
                fare: { ic: 209, ticket: 210 },
            });
        }
    }, 10_000);

    it.each([
        { from: 'sakuradamon', to: 'nijubashimae', exit: 'yurakucho', distance: 10 },
        { from: 'nijubashimae', to: 'sakuradamon', exit: 'hibiya', distance: 7 },
    ] as const)('$fromから$toの異駅名乗換は出場する側の$exitを運賃計算に使う', ({ from, to, exit, distance }) => {
        const result = searchRoutes(from, to, 1);
        expect(result.routes[0]).toMatchObject({
            outsideTransferCount: 1,
            insideTransferCount: 0,
            actualDistanceTenths: 17,
            fareCheckpoints: [{ stationId: exit, shortestDistanceTenths: distance, fare: { ic: 178, ticket: 180 } }],
        });
    });

    it('返す全経路で区間接続・距離合計・乗換回数が一致し、経路が重複しない', () => {
        const { routes } = searchRoutes('tokyo', 'asakusa', 3);
        expect(routes).toHaveLength(20);
        expect(new Set(routes.map((route) => route.key)).size).toBe(routes.length);
        for (const route of routes) {
            expect(route.legs[0].fromStationId).toBe('tokyo');
            expect(route.legs.at(-1)?.toStationId).toBe('asakusa');
            expect(route.transfers).toHaveLength(route.legs.length - 1);
            // 公開データの隣接関係から各区間を展開し、途中駅の再訪も検出する。
            const visited = new Set<StationId>();
            for (const leg of route.legs) {
                const queue: StationId[][] = [[leg.fromStationId]];
                let expanded: StationId[] | undefined;
                while (queue.length > 0) {
                    const path = queue.shift();
                    if (!path) throw new Error('展開待ちの経路がありません');
                    const current = path[path.length - 1];
                    if (current === leg.toStationId) {
                        expanded = path;
                        break;
                    }
                    for (const line of LINE_PATHS.filter((line) => line.lineId === leg.lineId)) {
                        const ids: readonly StationId[] = line.stations.map(([id]) => id);
                        const index = ids.indexOf(current);
                        if (index < 0) continue;
                        for (const neighbor of [ids[index - 1], ids[index + 1]]) {
                            if (neighbor && !path.includes(neighbor)) queue.push([...path, neighbor]);
                        }
                    }
                }
                expect(expanded).toBeDefined();
                if (!expanded) throw new Error('乗車区間を展開できません');
                // 同駅の乗換では、直前の区間終点と次の区間始点を一度だけ数える。
                if (!visited.has(leg.fromStationId)) visited.add(leg.fromStationId);
                for (const station of expanded.slice(1)) {
                    expect(visited.has(station), `再訪駅: ${station}`).toBe(false);
                    visited.add(station);
                }
            }

            expect(route.actualDistanceTenths).toBe(route.legs.reduce((total, leg) => total + leg.distanceTenths, 0));
            expect(route.transfers.filter((transfer) => transfer.type === 'outside')).toHaveLength(3);
            expect(route.transfers.filter((transfer) => transfer.type === 'inside')).toHaveLength(
                route.insideTransferCount,
            );
            for (const [index, transfer] of route.transfers.entries()) {
                expect(transfer).toMatchObject({
                    fromStationId: route.legs[index].toStationId,
                    fromLineId: route.legs[index].lineId,
                    toStationId: route.legs[index + 1].fromStationId,
                    toLineId: route.legs[index + 1].lineId,
                });
            }
        }
    });

    it('乗車駅と降車駅が同じ場合は経路を返さない', () => {
        // 片道経路は異なる発着駅を前提とするため、同駅指定の期待件数は0件。
        expect(searchRoutes('ginza', 'ginza')).toEqual({ routes: [], truncated: false, outsideTransferUpperBound: 0 });
    });

    it('出発駅を再訪しないと到達できない場合は経路を返さない', () => {
        // 北綾瀬へは綾瀬を経由する必要があるため、綾瀬発の片道経路では改札外乗換を挟めない。
        expect(searchRoutes('ayase', 'kita-ayase')).toEqual({
            routes: [],
            truncated: false,
            outsideTransferUpperBound: 0,
        });
    });

    it('訪問予算が0の場合は候補未発見と未確定の上限を返す', () => {
        expect(searchRoutes('tokyo', 'asakusa', 1, { visitLimit: 0 })).toEqual({
            routes: [],
            truncated: true,
            outsideTransferUpperBound: 1,
        });
    });

    it('探索を途中で打ち切っても先に見つけた完成経路を返す', () => {
        const result = searchRoutes('tokyo', 'asakusa', null, { visitLimit: 10_000 });
        expect(result.truncated).toBe(true);
        expect(result.routes.length).toBeGreaterThan(0);
        expect(result.outsideTransferUpperBound).toBe(14);
        expect(result.routes[0].outsideTransferCount).toBeLessThan(14);
    });

    it.each([
        ['wakoshi', 'nishi-funabashi'],
        ['honancho', 'kita-ayase'],
    ] as const)('%sから%sの上限10回検索は訪問予算を中間回数にも残す', (from, to) => {
        // どちらの区間にも5回の候補がある。10回の探索だけで予算を使い切らない。
        const result = searchRoutes(from, to, 10, { visitLimit: 100_000 });
        expect(result.truncated).toBe(true);
        expect(result.outsideTransferUpperBound).toBe(10);
        expect(result.routes.length).toBeGreaterThan(0);
        expect(result.routes[0].outsideTransferCount).toBeGreaterThanOrEqual(5);
    });

    it('上位回数の時間切れ後も中間回数を探索し、上位の未確定状態を保持する', () => {
        // 時計を一定速度で進め、実行環境に依存せず時間予算の消費を再現する。
        let now = 0;
        vi.mocked(performance.now).mockImplementation(() => {
            now += 50;
            return now;
        });
        const result = searchRoutes('wakoshi', 'nishi-funabashi', 10);
        expect(result.truncated).toBe(true);
        expect(result.outsideTransferUpperBound).toBe(10);
        expect(result.routes.length).toBeGreaterThan(0);
        expect(result.routes[0].outsideTransferCount).toBeGreaterThanOrEqual(5);
    });

    it('時間予算が0の場合は未探索の候補を完全な結果としない', () => {
        expect(searchRoutes('tokyo', 'asakusa', 1, { durationLimitMs: 0 })).toEqual({
            routes: [],
            truncated: true,
            outsideTransferUpperBound: 1,
        });
    });
});
