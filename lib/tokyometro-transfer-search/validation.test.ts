import { describe, expect, it } from 'vitest';
import {
    maximumOutsideTransferCountSchema,
    parseTokyoMetroTransferSearchForm,
    searchBudgetSchema,
} from '@/lib/tokyometro-transfer-search/validation';

const validForm = {
    durationLimitMs: 5000,
    stations: { fromStationId: 'tokyo', toStationId: 'asakusa' },
    outsideTransferIds: ['ueno'],
};

describe('検索条件の検証', () => {
    it.each([1, 14])('最大改札外乗換回数 %s は受け付ける', (value) => {
        expect(maximumOutsideTransferCountSchema.safeParse(value).success).toBe(true);
    });
    it.each([0, 15, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('最大改札外乗換回数 %s は拒否する', (value) => {
        expect(maximumOutsideTransferCountSchema.safeParse(value).success).toBe(false);
    });
    it('探索予算は訪問数0と時間0を受け付ける', () => {
        expect(searchBudgetSchema.safeParse({ visitLimit: 0, durationLimitMs: 0 }).success).toBe(true);
    });
    it('探索予算は安全な整数の訪問数と小数の時間を受け付ける', () => {
        expect(
            searchBudgetSchema.safeParse({ visitLimit: Number.MAX_SAFE_INTEGER, durationLimitMs: 0.5 }).success,
        ).toBe(true);
    });
    it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, Number.POSITIVE_INFINITY])(
        '訪問数 %s は拒否する',
        (value) => {
            expect(searchBudgetSchema.safeParse({ visitLimit: value, durationLimitMs: 5000 }).success).toBe(false);
        },
    );
    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('探索時間 %s は拒否する', (value) => {
        expect(searchBudgetSchema.safeParse({ visitLimit: 1, durationLimitMs: value }).success).toBe(false);
    });
});

describe('parseTokyoMetroTransferSearchForm', () => {
    it('異なる発着駅と改札外乗換駅を指定すればエラーを返さない', () => {
        expect(parseTokyoMetroTransferSearchForm(validForm)).toEqual({
            error: null,
            data: {
                durationLimitMs: 5000,
                stations: { fromStationId: 'tokyo', toStationId: 'asakusa' },
                outsideTransferIds: ['ueno'],
            },
        });
    });
    it.each([0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, Number.POSITIVE_INFINITY])(
        '画面の探索時間 %s は正の整数として受け付けない',
        (value) => {
            expect(parseTokyoMetroTransferSearchForm({ ...validForm, durationLimitMs: value }).error).toBe(
                '探索時間は正の整数で指定してください',
            );
        },
    );
    it.each([
        { fromStationId: null, toStationId: 'asakusa' },
        { fromStationId: 'tokyo', toStationId: null },
    ])('発着駅が未指定ならエラーを返す: %s', (stations) => {
        expect(parseTokyoMetroTransferSearchForm({ ...validForm, stations }).error).toBe(
            '乗車駅と降車駅を指定してください',
        );
    });
    it('発着駅が同じなら改札外乗換未選択より駅のエラーを優先する', () => {
        expect(
            parseTokyoMetroTransferSearchForm({
                ...validForm,
                stations: { fromStationId: 'tokyo', toStationId: 'tokyo' },
                outsideTransferIds: [],
            }).error,
        ).toBe('乗車駅と降車駅には異なる駅を指定してください');
    });
    it('改札外乗換が未選択ならエラーを返す', () => {
        expect(parseTokyoMetroTransferSearchForm({ ...validForm, outsideTransferIds: [] }).error).toBe(
            '利用する改札外乗換駅を1つ以上選択してください',
        );
    });
    it('複数項目が不正なら探索時間のエラーを優先する', () => {
        expect(
            parseTokyoMetroTransferSearchForm({
                durationLimitMs: 0,
                stations: { fromStationId: null, toStationId: null },
                outsideTransferIds: [],
            }).error,
        ).toBe('探索時間は正の整数で指定してください');
    });
});
