import { describe, expect, it } from 'vitest';
import { searchRoutes } from './search';

describe('改札外乗換駅の選択', () => {
    it('上野だけを選択した場合は上野で乗り換える経路を返す', () => {
        const result = searchRoutes('inaricho', 'iriya', null, { outsideTransferIds: ['ueno'] });
        expect(result.truncated).toBe(false);
        expect(result.outsideTransferUpperBound).toBe(1);
        expect(result.routes.length).toBeGreaterThan(0);
        for (const route of result.routes) {
            expect(route.transfers.filter((transfer) => transfer.type === 'outside')).toEqual([
                expect.objectContaining({ fromStationId: 'ueno', toStationId: 'ueno' }),
            ]);
        }
    });

    it.each([
        ['suehirocho', 'akihabara'],
        ['akihabara', 'suehirocho'],
    ] as const)('上野広小路・仲御徒町だけを選択した場合は%sから%sの乗換を両方向で許可する', (from, to) => {
        const result = searchRoutes(from, to, null, { outsideTransferIds: ['ueno-hirokoji'] });
        expect(result.truncated).toBe(false);
        expect(result.routes.length).toBeGreaterThan(0);
        for (const route of result.routes) {
            expect(route.outsideTransferCount).toBe(1);
            for (const transfer of route.transfers.filter((transfer) => transfer.type === 'outside')) {
                expect([transfer.fromStationId, transfer.toStationId].sort()).toEqual([
                    'naka-okachimachi',
                    'ueno-hirokoji',
                ]);
            }
        }
    });

    it('発駅の乗換だけを選択した場合は経路を返さない', () => {
        expect(searchRoutes('ueno', 'iriya', null, { outsideTransferIds: ['ueno'] })).toEqual({
            routes: [],
            truncated: false,
            outsideTransferUpperBound: 0,
        });
    });

    it('選択が空の場合はエラーにする', () => {
        expect(() => searchRoutes('inaricho', 'iriya', null, { outsideTransferIds: [] })).toThrow(
            '利用する改札外乗換駅を1つ以上選択してください',
        );
    });
});
