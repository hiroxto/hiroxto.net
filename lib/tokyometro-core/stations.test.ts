import { describe, expect, it } from 'vitest';
import { isSameStation, stationIdSchema } from '@/lib/tokyometro-core/stations';

describe('駅IDの検証', () => {
    it.each(['constructor', '__proto__', 'unknown'])('存在しない駅ID %s は拒否する', (value) => {
        expect(stationIdSchema.safeParse(value).success).toBe(false);
    });
});

// 出典: 東京メトロ旅客営業規程第45条第2項の異駅名乗換駅。
// https://www.tokyometro.jp/ticket/terms/pdf/ryokyaku_eigyo_260119.pdf
const stationPairs = [
    ['akasaka-mitsuke', 'nagatacho'],
    ['tameike-sanno', 'kokkai-gijidomae'],
    ['ueno-hirokoji', 'naka-okachimachi'],
    ['hibiya', 'yurakucho'],
    ['awajicho', 'shin-ochanomizu'],
    ['ningyocho', 'suitengumae'],
    ['tsukiji', 'shintomicho'],
    ['ginza', 'ginza-itchome'],
    ['toranomon', 'toranomon-hills'],
] as const;

describe('同一駅の判定', () => {
    it.each(stationPairs)('%sと%sは両方向とも同一駅として扱う', (from, to) => {
        expect(isSameStation(from, to)).toBe(true);
        expect(isSameStation(to, from)).toBe(true);
    });
    it('同じ駅IDは同一駅として扱う', () => {
        expect(isSameStation('tokyo', 'tokyo')).toBe(true);
    });
    it('隣接する別駅や未指定の駅は同一駅として扱わない', () => {
        expect(isSameStation('ueno-hirokoji', 'ueno')).toBe(false);
        expect(isSameStation(null, null)).toBe(false);
    });
});
