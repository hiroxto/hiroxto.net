import { describe, expect, it } from 'vitest';
import { allOutsideTransferIds } from './outside-transfers';
import { parseTokyoMetroTransferSearchParams } from './search-params';

describe('parseTokyoMetroTransferSearchParams', () => {
    it.each([
        [undefined, 20],
        ['', 20],
        ['5', 5],
        ['30', 30],
    ] as const)('取得件数の指定%sを%s件に復元する', (resultLimit, expected) => {
        expect(parseTokyoMetroTransferSearchParams({ resultLimit })).toMatchObject({
            resultLimit: expected,
            error: null,
        });
    });

    it.each(['0', '-1', '1.5', '1.0000000000000001', 'abc', 'Infinity', ['5', '10']])(
        '取得件数%sが不正なら検索を開始しない',
        (resultLimit) => {
            expect(parseTokyoMetroTransferSearchParams({ from: 'ginza', to: 'asakusa', resultLimit })).toMatchObject({
                fromStationId: null,
                error: '取得件数は1以上の整数で指定してください',
            });
        },
    );

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
        ).toEqual({
            fromStationId: 'inaricho',
            toStationId: 'iriya',
            maximumOutsideTransferCount: 1,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
            error: null,
        });
    });

    it('乗車駅または降車駅のみ指定された場合は駅の検索条件を設定しない', () => {
        expect(parseTokyoMetroTransferSearchParams({ from: 'inaricho' })).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
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
        ).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
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
            ).toEqual({
                fromStationId: null,
                toStationId: null,
                maximumOutsideTransferCount: null,
                resultLimit: 20,
                includeInsideTransfers: true,
                outsideTransferIds: allOutsideTransferIds,
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
        ).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
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
        ).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
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
        ).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
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
        ).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
            resultLimit: 20,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
            error: null,
        });
    });
});
