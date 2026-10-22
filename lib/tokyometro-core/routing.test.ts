import { describe, expect, it } from 'vitest';
import { getRideSegments, getTransfers } from '@/lib/tokyometro-core/routing';

describe('getRideSegments', () => {
    it('着駅で打ち切る場合は着駅より先の区間を返さない', () => {
        const segments = getRideSegments('shinjuku', 'marunouchi', 'ginza');
        const toGinza = segments.find((segment) => segment.toStationId === 'ginza');

        // 新宿から銀座までの営業キロは0.3+0.7+0.9+1.0+1.3+0.9+0.7+1.0=6.8km。
        expect(toGinza?.distanceTenths).toBe(68);
        expect(toGinza?.rideSteps.map((step) => step.toStationId)).toEqual([
            'shinjuku-sanchome',
            'shinjuku-gyoemmae',
            'yotsuya-sanchome',
            'yotsuya',
            'akasaka-mitsuke',
            'kokkai-gijidomae',
            'kasumigaseki',
            'ginza',
        ]);
        expect(segments.some((segment) => segment.toStationId === 'otemachi')).toBe(false);
    });

    it('着駅で打ち切らない場合は着駅を通過する区間も返す', () => {
        const segments = getRideSegments('shinjuku', 'marunouchi', 'ginza', false);
        const toOtemachi = segments.find((segment) => segment.toStationId === 'otemachi');

        expect(toOtemachi?.distanceTenths).toBe(85);
        expect(toOtemachi?.rideSteps.slice(-3).map((step) => step.toStationId)).toEqual(['ginza', 'tokyo', 'otemachi']);
    });

    it('丸ノ内線支線から本線へ同一路線の乗車として接続する', () => {
        const segment = getRideSegments('honancho', 'marunouchi', 'shinjuku').find(
            (candidate) => candidate.toStationId === 'shinjuku',
        );

        expect(segment?.distanceTenths).toBe(51);
        expect(segment?.rideSteps.map((step) => step.toStationId)).toEqual([
            'nakano-fujimicho',
            'nakano-shimbashi',
            'nakano-sakaue',
            'nishi-shinjuku',
            'shinjuku',
        ]);
    });
});

describe('getTransfers', () => {
    it('改札内外を選べる同駅の乗換は改札外を先に返す', () => {
        const transfers = getTransfers('otemachi', 'marunouchi').filter((transfer) => transfer.toLineId === 'tozai');

        expect(transfers.map((transfer) => transfer.type)).toEqual(['outside', 'inside']);
    });

    it('異駅名の乗換は往復それぞれの駅と路線の方向を返す', () => {
        expect(getTransfers('ueno-hirokoji', 'ginza')).toEqual([
            {
                kind: 'transfer',
                fromStationId: 'ueno-hirokoji',
                toStationId: 'naka-okachimachi',
                fromLineId: 'ginza',
                toLineId: 'hibiya',
                type: 'outside',
            },
        ]);
        expect(getTransfers('naka-okachimachi', 'hibiya')).toEqual([
            {
                kind: 'transfer',
                fromStationId: 'naka-okachimachi',
                toStationId: 'ueno-hirokoji',
                fromLineId: 'hibiya',
                toLineId: 'ginza',
                type: 'outside',
            },
        ]);
    });
});
