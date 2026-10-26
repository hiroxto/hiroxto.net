import { describe, expect, it } from 'vitest';
import { getShortestFareDistances } from '@/lib/tokyometro-core/distances';
import { calculateFareBetweenStations, calculateRouteFare } from '@/lib/tokyometro-core/fare';

describe('calculateFareBetweenStations', () => {
    it.each([
        ['ueno-hirokoji', 'naka-okachimachi'],
        ['naka-okachimachi', 'ueno-hirokoji'],
        ['akasaka-mitsuke', 'nagatacho'],
        ['ginza', 'ginza-itchome'],
        ['tokyo', 'tokyo'],
    ] as const)('%sから%sは同一駅のため運賃計算を拒否する', (origin, destination) => {
        expect(() => calculateFareBetweenStations(origin, destination)).toThrow(
            '乗車駅と降車駅には異なる駅を指定してください',
        );
        expect(() => calculateRouteFare(origin, destination, [])).toThrow(
            '乗車駅と降車駅には異なる駅を指定してください',
        );
        expect(getShortestFareDistances(origin).get(destination)).toBe(0);
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
