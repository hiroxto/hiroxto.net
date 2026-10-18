import { describe, expect, it } from 'vitest';
import { parseTokyoMetroTransferSearchParams } from './search-params';

describe('parseTokyoMetroTransferSearchParams', () => {
    it.each([
        [undefined, 5000],
        ['1', 1],
        ['12000', 12000],
    ])('探索時間 %s をミリ秒単位の %s に変換する', (value, expected) => {
        expect(parseTokyoMetroTransferSearchParams({ durationLimitMs: value })).toMatchObject({
            durationLimitMs: expected,
            error: null,
        });
    });

    it.each(['', '0', '-1', '1.5', 'invalid', 'Infinity', ['1', '2']])(
        '探索時間 %s が正の整数でない場合は検索条件を破棄する',
        (value) => {
            expect(
                parseTokyoMetroTransferSearchParams({ from: 'inaricho', to: 'iriya', durationLimitMs: value }),
            ).toMatchObject({ fromStationId: null, error: '探索時間は正の整数で指定してください' });
        },
    );

    it('改札外乗換駅が未指定なら全14地点を重複なく復元する', () => {
        const result = parseTokyoMetroTransferSearchParams({});
        expect([...result.outsideTransferIds].sort()).toEqual([
            'awajicho',
            'ginza',
            'hibiya',
            'iidabashi',
            'ikebukuro',
            'mitsukoshimae',
            'ningyocho',
            'otemachi',
            'shibuya',
            'shinjuku-sanchome',
            'toranomon',
            'tsukiji',
            'ueno',
            'ueno-hirokoji',
        ]);
        expect(result.error).toBeNull();
    });

    it('選択した改札外乗換駅をURLから復元する', () => {
        expect(parseTokyoMetroTransferSearchParams({ outsideTransfers: 'ueno,hibiya' })).toMatchObject({
            outsideTransferIds: ['ueno', 'hibiya'],
            error: null,
        });
    });

    it.each(['', 'tokyo', 'unknown', 'ueno,', ['ueno', 'hibiya']])(
        '改札外乗換駅の不正な指定 %s は検索を開始しない',
        (value) => {
            const result = parseTokyoMetroTransferSearchParams({
                from: 'inaricho',
                to: 'iriya',
                outsideTransfers: value,
            });
            expect(result.error).not.toBeNull();
            expect(result.fromStationId).toBeNull();
        },
    );

    it.each([
        [undefined, true],
        ['true', true],
        ['false', false],
        [['false', 'true'], true],
    ] satisfies [string | string[] | undefined, boolean][])(
        '改札内乗換の指定 %s を %s に変換する',
        (value, expected) => {
            const result = parseTokyoMetroTransferSearchParams({
                from: 'tokyo',
                to: 'asakusa',
                includeInsideTransfers: value,
            });
            expect(result).toMatchObject({ includeInsideTransfers: expected, error: null });
        },
    );

    it.each(['', '0', 'invalid'])('改札内乗換の指定が「%s」の場合はエラーを返す', (value) => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: 'tokyo',
                to: 'asakusa',
                includeInsideTransfers: value,
            }),
        ).toMatchObject({
            fromStationId: null,
            toStationId: null,
            error: '改札内乗換の指定はtrueまたはfalseにしてください',
        });
    });

    it('駅と最大改札外乗換回数が有効な場合は検索条件に変換する', () => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: 'inaricho',
                to: 'iriya',
                maxOutsideTransfers: '1',
            }),
        ).toMatchObject({
            fromStationId: 'inaricho',
            toStationId: 'iriya',
            maximumOutsideTransferCount: 1,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: null,
        });
    });

    it('乗車駅または降車駅のみ指定された場合は駅の検索条件を設定しない', () => {
        expect(parseTokyoMetroTransferSearchParams({ from: 'inaricho' })).toMatchObject({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: null,
        });
    });

    it('駅IDが不正な場合は検索条件を破棄してエラーを返す', () => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: 'unknown-station',
                to: 'iriya',
                maxOutsideTransfers: '1',
            }),
        ).toMatchObject({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: '指定された駅が見つかりません',
        });
    });

    it.each(['constructor', 'toString', '__proto__'])(
        '駅IDがObject.prototypeのプロパティ名と一致する場合はエラーを返す',
        (value) => {
            expect(
                parseTokyoMetroTransferSearchParams({
                    from: value,
                    to: 'iriya',
                }),
            ).toMatchObject({
                fromStationId: null,
                toStationId: null,
                maximumOutsideTransferCount: null,
                includeInsideTransfers: true,
                durationLimitMs: 5000,
                error: '指定された駅が見つかりません',
            });
        },
    );

    it('乗車駅と降車駅が同じ場合は検索条件を破棄してエラーを返す', () => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: 'ginza',
                to: 'ginza',
            }),
        ).toMatchObject({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: '乗車駅と降車駅には異なる駅を指定してください',
        });
    });

    it.each(['0', '15', '1.5', 'invalid'])('最大改札外乗換回数が%sの場合はエラーを返す', (value) => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: 'inaricho',
                to: 'iriya',
                maxOutsideTransfers: value,
            }),
        ).toMatchObject({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: '最大改札外乗換回数は1〜14回で指定してください',
        });
    });

    it('駅IDと最大改札外乗換回数がともに不正な場合は回数のエラーを優先する', () => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: 'unknown-station',
                to: 'iriya',
                maxOutsideTransfers: '15',
            }),
        ).toMatchObject({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: '最大改札外乗換回数は1〜14回で指定してください',
        });
    });

    it('複数指定されたクエリパラメータは未指定として扱う', () => {
        expect(
            parseTokyoMetroTransferSearchParams({
                from: ['inaricho', 'ginza'],
                to: 'iriya',
                maxOutsideTransfers: ['1', '2'],
            }),
        ).toMatchObject({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            includeInsideTransfers: true,
            durationLimitMs: 5000,
            error: null,
        });
    });
});
