import { describe, expect, it } from 'vitest';
import { stationToLines } from './route-complete';

describe('stationToLines', () => {
    it('東京に接続する代表路線を取得できること', () => {
        expect(stationToLines.get('東京')).toContain('新幹線');
        expect(stationToLines.get('東京')).toContain('東北線');
        expect(stationToLines.get('東京')).toContain('東海道線');
    });

    it('複数路線に属する駅を正しく列挙すること', () => {
        expect(stationToLines.get('桑園')?.toSorted()).toEqual(['内浦湾線', '函館線', '札沼線']);
        expect(stationToLines.get('武雄温泉')?.toSorted()).toEqual(['佐世保線', '西九州新幹線']);
    });

    it('代表駅で余計な路線を含めないこと', () => {
        expect(stationToLines.get('新大村')?.toSorted()).toEqual(['大村線', '西九州新幹線']);
    });
});
