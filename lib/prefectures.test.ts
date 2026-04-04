import { describe, expect, it } from 'vitest';
import { getPrefectureNameByCode, jisX0401Prefectures } from '@/lib/prefectures';

describe('prefectures', () => {
    it('JIS X 0401 の都道府県一覧を47件持つこと', () => {
        expect(jisX0401Prefectures).toHaveLength(47);
    });

    it('都道府県コードから都道府県名を取得できること', () => {
        expect(getPrefectureNameByCode('01')).toBe('北海道');
        expect(getPrefectureNameByCode('13')).toBe('東京都');
        expect(getPrefectureNameByCode('47')).toBe('沖縄県');
    });
});
