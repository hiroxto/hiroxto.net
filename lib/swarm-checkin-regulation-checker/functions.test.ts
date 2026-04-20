import { describe, expect, it } from 'vitest';
import {
    checkAllLimits,
    checkLimits,
    createdAt2Date,
    date2String,
    evaluateAutoFetchStability,
    getAutoFetchComparisonCount,
    getJstDayRange,
    getMostFurthestDate,
    getNextAutoFetchAt,
    getNextJstMidnight,
    getNextManualAutoFetchAt,
    getNextRefreshAt,
    resolveAutoFetchFailure,
    resolveAutoFetchSuccess,
} from '@/lib/swarm-checkin-regulation-checker/functions';
import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

function createCheckin(id: string, isoDate: string): CheckinItem {
    return {
        id,
        createdAt: Math.floor(new Date(isoDate).getTime() / 1000),
        type: 'checkin',
        timeZoneOffset: 540,
        venue: {
            id: `venue-${id}`,
            name: `Venue ${id}`,
            location: {
                address: '',
                lat: 0,
                lng: 0,
                labeledLatLngs: [],
                postalCode: '',
                cc: 'JP',
                city: 'Tokyo',
                state: 'Tokyo',
                country: 'Japan',
                formattedAddress: [],
            },
            categories: [],
        },
    };
}

describe('date2String()', () => {
    it('日本時間の文字列にフォーマットできること', () => {
        expect(date2String(new Date('2024-10-01T03:34:56Z'))).toBe('2024-10-01 12:34:56');
    });
});

describe('createdAt2Date()', () => {
    it('タイムスタンプをDateに変換できること', () => {
        const createdAt = 1728108666;

        expect(createdAt2Date(createdAt)).toStrictEqual(new Date(createdAt * 1000));
    });
});

describe('checkLimits()', () => {
    it('閾値未満なら規制されないこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('1', '2024-10-01T03:33:30Z'),
            createCheckin('2', '2024-10-01T03:34:00Z'),
            createCheckin('3', '2024-10-01T03:34:30Z'),
        ];

        const result = checkLimits(checkins, now, 5, 2, 'minutes');

        expect(result.isLimited).toBe(false);
        expect(result.checkins).toHaveLength(3);
        expect(result.unLimitingAt).toBeNull();
    });

    it('閾値以上なら規制され解除日時を返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('1', '2024-10-01T03:33:00Z'),
            createCheckin('2', '2024-10-01T03:33:30Z'),
            createCheckin('3', '2024-10-01T03:34:00Z'),
            createCheckin('4', '2024-10-01T03:34:10Z'),
            createCheckin('5', '2024-10-01T03:34:20Z'),
        ];

        const result = checkLimits(checkins, now, 5, 2, 'minutes');

        expect(result.isLimited).toBe(true);
        expect(result.checkins).toHaveLength(5);
        expect(result.unLimitingAt).toStrictEqual(new Date('2024-10-01T03:36:20Z'));
    });
});

describe('checkAllLimits()', () => {
    it('複数規制の中で最も遅い解除日時を返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('1', '2024-10-01T03:20:00Z'),
            createCheckin('2', '2024-10-01T03:20:30Z'),
            createCheckin('3', '2024-10-01T03:21:00Z'),
            createCheckin('4', '2024-10-01T03:21:30Z'),
            createCheckin('5', '2024-10-01T03:22:00Z'),
            createCheckin('6', '2024-10-01T03:22:30Z'),
            createCheckin('7', '2024-10-01T03:23:00Z'),
            createCheckin('8', '2024-10-01T03:23:30Z'),
        ];

        const result = checkAllLimits(checkins, now);

        expect(result.isLimited).toBe(true);
        expect(result.unLimitingAts).toStrictEqual(new Date('2024-10-01T03:38:30Z'));
    });
});

describe('getMostFurthestDate()', () => {
    it('最も遠い日時を返すこと', () => {
        const now = new Date('2024-03-20T12:00:00Z');
        const result = getMostFurthestDate([new Date('2024-03-20T13:00:00Z'), new Date('2024-03-20T15:00:00Z')], now);

        expect(result).toStrictEqual(new Date('2024-03-20T15:00:00Z'));
    });
});

describe('getJstDayRange()', () => {
    it('日本時間の日付境界を返すこと', () => {
        const target = new Date('2024-10-01T03:34:56Z');
        const range = getJstDayRange(target);

        expect(range.start).toStrictEqual(new Date('2024-09-30T15:00:00Z'));
        expect(range.end).toStrictEqual(new Date('2024-10-01T14:59:59.999Z'));
    });
});

describe('getNextJstMidnight()', () => {
    it('次の日本時間の0時を返すこと', () => {
        const target = new Date('2024-10-01T03:34:56Z');

        expect(getNextJstMidnight(target)).toStrictEqual(new Date('2024-10-01T15:00:00Z'));
    });
});

describe('getNextRefreshAt()', () => {
    it('規制解除前なら最も近い解除日時を返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('1', '2024-10-01T03:33:00Z'),
            createCheckin('2', '2024-10-01T03:33:30Z'),
            createCheckin('3', '2024-10-01T03:34:00Z'),
            createCheckin('4', '2024-10-01T03:34:10Z'),
            createCheckin('5', '2024-10-01T03:34:20Z'),
        ];

        expect(getNextRefreshAt(checkins, now)).toStrictEqual(new Date('2024-10-01T03:36:20Z'));
    });

    it('非規制でも対象チェックインがあれば各基準の最古チェックインから最も近い解除日時を返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('4', '2024-10-01T03:33:50Z'),
            createCheckin('3', '2024-10-01T03:34:30Z'),
            createCheckin('1', '2024-09-30T12:00:00Z'),
            createCheckin('2', '2024-10-01T03:20:00Z'),
        ];

        expect(getNextRefreshAt(checkins, now)).toStrictEqual(new Date('2024-10-01T03:35:00Z'));
    });

    it('規制中でなければ次の日本時間の0時を返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');

        expect(getNextRefreshAt([], now)).toStrictEqual(new Date('2024-10-01T15:00:00Z'));
    });

    it('一部の条件が規制中でも他条件の非規制判定更新時刻を優先して返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('1', '2024-10-01T03:26:00Z'),
            createCheckin('2', '2024-10-01T03:27:00Z'),
            createCheckin('3', '2024-10-01T03:28:00Z'),
            createCheckin('4', '2024-10-01T03:29:00Z'),
            createCheckin('5', '2024-10-01T03:30:00Z'),
            createCheckin('6', '2024-10-01T03:34:00Z'),
            createCheckin('7', '2024-10-01T03:34:10Z'),
            createCheckin('8', '2024-10-01T03:34:20Z'),
            createCheckin('9', '2024-10-01T03:34:30Z'),
        ];

        expect(getNextRefreshAt(checkins, now)).toStrictEqual(new Date('2024-10-01T03:36:00Z'));
    });
});

describe('getAutoFetchComparisonCount()', () => {
    it('各条件の判定件数の最大値を返すこと', () => {
        const now = new Date('2024-10-01T03:34:56Z');
        const checkins = [
            createCheckin('1', '2024-09-30T12:00:00Z'),
            createCheckin('2', '2024-10-01T03:20:00Z'),
            createCheckin('3', '2024-10-01T03:20:30Z'),
            createCheckin('4', '2024-10-01T03:21:00Z'),
            createCheckin('5', '2024-10-01T03:21:30Z'),
            createCheckin('6', '2024-10-01T03:22:00Z'),
            createCheckin('7', '2024-10-01T03:22:30Z'),
        ];

        expect(getAutoFetchComparisonCount(checkAllLimits(checkins, now))).toBe(7);
    });
});

describe('getNextAutoFetchAt()', () => {
    it('規制中なら規制解除日時に間隔を足した日時を返すこと', () => {
        const fetchedAt = new Date('2024-10-01T03:34:56Z');
        const result = checkAllLimits(
            [
                createCheckin('1', '2024-10-01T03:33:00Z'),
                createCheckin('2', '2024-10-01T03:33:30Z'),
                createCheckin('3', '2024-10-01T03:34:00Z'),
                createCheckin('4', '2024-10-01T03:34:10Z'),
                createCheckin('5', '2024-10-01T03:34:20Z'),
            ],
            fetchedAt,
        );

        expect(getNextAutoFetchAt(result, fetchedAt, 30)).toStrictEqual(new Date('2024-10-01T03:36:50Z'));
    });

    it('非規制なら取得時刻に間隔を足した日時を返すこと', () => {
        const fetchedAt = new Date('2024-10-01T03:34:56Z');
        const result = checkAllLimits([createCheckin('1', '2024-10-01T03:34:20Z')], fetchedAt);

        expect(getNextAutoFetchAt(result, fetchedAt, 30)).toStrictEqual(new Date('2024-10-01T03:35:26Z'));
    });
});

describe('getNextManualAutoFetchAt()', () => {
    it('非規制から規制状態になったときは規制解除基準で返すこと', () => {
        const triggeredAt = new Date('2024-10-01T03:34:56Z');
        const fetchedAt = new Date('2024-10-01T03:35:00Z');
        const nextResult = checkAllLimits(
            [
                createCheckin('1', '2024-10-01T03:33:01Z'),
                createCheckin('2', '2024-10-01T03:33:30Z'),
                createCheckin('3', '2024-10-01T03:34:00Z'),
                createCheckin('4', '2024-10-01T03:34:10Z'),
                createCheckin('5', '2024-10-01T03:34:20Z'),
            ],
            fetchedAt,
        );

        expect(getNextManualAutoFetchAt(false, nextResult, triggeredAt, fetchedAt, 5)).toStrictEqual(
            new Date('2024-10-01T03:36:25Z'),
        );
    });

    it('すでに規制中でないまま手動取得しても次回日時は押下時刻基準で返すこと', () => {
        const triggeredAt = new Date('2024-10-01T03:34:56Z');
        const fetchedAt = new Date('2024-10-01T03:35:00Z');
        const nextResult = checkAllLimits([], fetchedAt);

        expect(getNextManualAutoFetchAt(false, nextResult, triggeredAt, fetchedAt, 5)).toStrictEqual(
            new Date('2024-10-01T03:35:01Z'),
        );
    });
});

describe('evaluateAutoFetchStability()', () => {
    it('初回は比較値を保存して未変動回数を増やさないこと', () => {
        expect(evaluateAutoFetchStability({ previousCount: null, unchangedCount: 0 }, 4)).toStrictEqual({
            previousCount: 4,
            unchangedCount: 0,
            shouldDisable: false,
        });
    });

    it('比較値が変わったら未変動回数をリセットすること', () => {
        expect(evaluateAutoFetchStability({ previousCount: 4, unchangedCount: 3 }, 5)).toStrictEqual({
            previousCount: 5,
            unchangedCount: 0,
            shouldDisable: false,
        });
    });

    it('同じ比較値が3回続いたら停止対象にすること', () => {
        expect(evaluateAutoFetchStability({ previousCount: 4, unchangedCount: 2 }, 4)).toStrictEqual({
            previousCount: 4,
            unchangedCount: 3,
            shouldDisable: true,
        });
    });
});

describe('resolveAutoFetchSuccess()', () => {
    it('継続する場合は次回自動取得日時を返すこと', () => {
        const fetchedAt = new Date('2024-10-01T03:34:56Z');
        const result = checkAllLimits([], fetchedAt);

        expect(resolveAutoFetchSuccess({ previousCount: null, unchangedCount: 0 }, result, fetchedAt, 5)).toStrictEqual(
            {
                autoFetchEnabled: true,
                nextAutoFetchAt: new Date('2024-10-01T03:35:01Z'),
                previousCount: 0,
                unchangedCount: 0,
            },
        );
    });

    it('未変動が3回続いたら自動取得を停止すること', () => {
        const fetchedAt = new Date('2024-10-01T03:34:56Z');
        const result = checkAllLimits([], fetchedAt);

        expect(resolveAutoFetchSuccess({ previousCount: 0, unchangedCount: 2 }, result, fetchedAt, 5)).toStrictEqual({
            autoFetchEnabled: false,
            nextAutoFetchAt: null,
            previousCount: null,
            unchangedCount: 0,
        });
    });

    it('取得完了時点ですでに自動取得が無効なら再有効化しないこと', () => {
        const fetchedAt = new Date('2024-10-01T03:34:56Z');
        const result = checkAllLimits([], fetchedAt);

        expect(
            resolveAutoFetchSuccess({ previousCount: 1, unchangedCount: 1 }, result, fetchedAt, 5, false),
        ).toStrictEqual({
            autoFetchEnabled: false,
            nextAutoFetchAt: null,
            previousCount: null,
            unchangedCount: 0,
        });
    });
});

describe('resolveAutoFetchFailure()', () => {
    it('自動取得失敗時の停止状態を返すこと', () => {
        expect(resolveAutoFetchFailure()).toStrictEqual({
            autoFetchEnabled: false,
            nextAutoFetchAt: null,
            previousCount: null,
            unchangedCount: 0,
        });
    });
});
