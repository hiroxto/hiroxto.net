import { describe, expect, it } from 'vitest';
import { parseTokyoMetroTransferSearchParams } from './search-params';

describe('parseTokyoMetroTransferSearchParams', () => {
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
            error: null,
        });
    });

    it('乗車駅または降車駅のみ指定された場合は駅の検索条件を設定しない', () => {
        expect(parseTokyoMetroTransferSearchParams({ from: 'inaricho' })).toEqual({
            fromStationId: null,
            toStationId: null,
            maximumOutsideTransferCount: null,
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
            error: '指定された駅が見つかりません',
        });
    });

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
            error: null,
        });
    });
});
