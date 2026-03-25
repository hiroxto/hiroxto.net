import { describe, expect, it } from 'vitest';
import {
    checkAllLimits,
    checkLimits,
    createdAt2Date,
    date2String,
    getJstDayRange,
    getMostFurthestDate,
    getNextJstMidnight,
    getNextRefreshAt,
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
});
