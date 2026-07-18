import { describe, expect, it } from 'vitest';
import { stationToLines } from './route-complete';

describe('stationToLines', () => {
    it('東京に接続する代表路線を取得できること', () => {
        expect(stationToLines.get('東京')).toContain('新幹線');
        expect(stationToLines.get('東京')).toContain('東北線');
        expect(stationToLines.get('東京')).toContain('東海道線');
    });

    it('複数路線に属する駅を正しく列挙すること', () => {
        expect(stationToLines.get('桑園')).toEqual(['札沼線', '函館線', '内浦湾線']);
        expect(stationToLines.get('武雄温泉')).toEqual(['西九州新幹線', '佐世保線']);
    });

    it('代表駅で余計な路線を含めないこと', () => {
        expect(stationToLines.get('新大村')).toEqual(['西九州新幹線', '大村線']);
    });
});
