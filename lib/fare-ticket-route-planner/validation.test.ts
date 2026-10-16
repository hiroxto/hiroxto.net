import { describe, expect, it } from 'vitest';
import { getRouteStationError } from '@/lib/fare-ticket-route-planner/validation';

const routes = [
    { id: '1', line: '山手線', station: ' 上野 ' },
    { id: '2', line: '銀座線', station: '渋谷' },
];

describe('getRouteStationError', () => {
    it.each(['', '   ', '新宿', '上野'])('空欄または重複のない駅「%s」はエラーを返さない', (station) => {
        expect(
            getRouteStationError({ index: 0, station, departure: '東京', destination: '秋葉原', routes }),
        ).toBeNull();
    });
    it.each([
        [' 東京 ', '東京', '東京', '発着駅と重複'],
        [' 東京 ', '東京', '秋葉原', '発駅と重複'],
        [' 秋葉原 ', '東京', '秋葉原', '着駅と重複'],
        [' 渋谷 ', '東京', '秋葉原', '経路内重複'],
        ['渋谷', '渋谷', '秋葉原', '発駅と重複'],
    ])('駅「%s」、発駅「%s」、着駅「%s」は「%s」を返す', (station, departure, destination, expected) => {
        expect(getRouteStationError({ index: 0, station, departure, destination, routes })).toBe(expected);
    });
    it('別の行の駅名も前後の空白を除いて重複を判定する', () => {
        expect(
            getRouteStationError({ index: 1, station: '上野', departure: '東京', destination: '秋葉原', routes }),
        ).toBe('経路内重複');
    });
    it('発着駅の文字列は空白を除去せず比較する', () => {
        expect(
            getRouteStationError({ index: 0, station: '東京', departure: ' 東京 ', destination: '秋葉原', routes }),
        ).toBeNull();
    });
});
