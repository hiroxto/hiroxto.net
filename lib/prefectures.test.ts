import { describe, expect, it } from 'vitest';
import { getPrefectureNameByCode } from '@/lib/prefectures';

describe('prefectures', () => {
    it('都道府県コードから都道府県名を取得できること', () => {
        expect(getPrefectureNameByCode('01')).toBe('北海道');
        expect(getPrefectureNameByCode('13')).toBe('東京都');
        expect(getPrefectureNameByCode('47')).toBe('沖縄県');
    });
});
