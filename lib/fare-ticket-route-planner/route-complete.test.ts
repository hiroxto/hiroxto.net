import { describe, expect, it } from 'vitest';
import { lineToStations, stationToLines } from './route-complete';

describe('stationToLines', () => {
    it('lineToStations から逆引きできること', () => {
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

    it('lineToStations に存在する全駅が stationToLines から逆参照できること', () => {
        for (const [line, stations] of lineToStations) {
            for (const station of stations) {
                expect(stationToLines.get(station)).toContain(line);
            }
        }
    });
});
