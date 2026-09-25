import { describe, expect, it } from 'vitest';
import { buildRecordedPath, getDefaultSeason } from './path';

describe('getDefaultSeason', () => {
    it.each([
        { month: 1, expected: '01_winter' },
        { month: 4, expected: '02_spring' },
        { month: 7, expected: '03_summer' },
        { month: 10, expected: '04_autumn' },
        { month: 12, expected: '01_winter' },
    ])('$month月の既定シーズンを返す', ({ month, expected }) => {
        expect(getDefaultSeason(month)).toBe(expected);
    });
});

describe('buildRecordedPath', () => {
    it('通常の番組は年・シーズン・番組名を階層にしたパスを返す', () => {
        expect(
            buildRecordedPath({
                year: '2026',
                season: '02_spring',
                isUnclassifiable: false,
                isRepeat: false,
                programName: 'my-anime',
            }),
        ).toBe('2026/02_spring/my-anime');
    });

    it('再放送の番組名には repeat_ を付ける', () => {
        expect(
            buildRecordedPath({
                year: '2026',
                season: '02_spring',
                isUnclassifiable: false,
                isRepeat: true,
                programName: 'my-anime',
            }),
        ).toBe('2026/02_spring/repeat_my-anime');
    });

    it('分類不要の番組は番組名の代わりに 10_other を使う', () => {
        expect(
            buildRecordedPath({
                year: '2026',
                season: '02_spring',
                isUnclassifiable: true,
                isRepeat: true,
                programName: 'my-anime',
            }),
        ).toBe('2026/02_spring/10_other');
    });
});
