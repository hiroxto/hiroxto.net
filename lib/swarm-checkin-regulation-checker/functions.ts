import type { Duration } from 'date-fns';
import {
    add,
    addDays,
    differenceInMilliseconds,
    endOfDay,
    isAfter,
    startOfDay,
    sub,
    subDays as subDateFnsDays,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import type {
    AllLimitCheckResult,
    AutoFetchStabilityEvaluation,
    AutoFetchStabilityState,
    CheckinItem,
    LimitCheckResult,
    PeriodUnit,
} from '@/lib/swarm-checkin-regulation-checker/types';

export function date2String(date: Date): string {
    return formatInTimeZone(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}

export function createdAt2Date(createdAt: number): Date {
    return new Date(createdAt * 1000);
}

export function periodToDuration(value: number, unit: PeriodUnit): Duration {
    switch (unit) {
        case 'minutes':
            return {
                minutes: value,
            };
        case 'days':
            return {
                days: value,
            };
    }
}

export function addPeriod(date: Date, value: number, unit: PeriodUnit): Date {
    return add(date, periodToDuration(value, unit));
}

export function checkLimits(
    checkins: CheckinItem[],
    now: Date,
    checkinLimit: number,
    periodValue: number,
    periodUnit: PeriodUnit,
): LimitCheckResult {
    const duration = periodToDuration(periodValue, periodUnit);
    const limitDate = sub(now, duration);
    const limitingCheckins = checkins.filter((checkin) => isAfter(createdAt2Date(checkin.createdAt), limitDate));
    const thresholdCheckin = limitingCheckins[checkinLimit - 1];

    return {
        limit: checkinLimit,
        checkins: limitingCheckins,
        period: {
            from: limitDate,
            to: now,
            value: periodValue,
            unit: periodUnit,
        },
        isLimited: limitingCheckins.length >= checkinLimit,
        unLimitingAt:
            thresholdCheckin == null
                ? null
                : addPeriod(createdAt2Date(thresholdCheckin.createdAt), periodValue, periodUnit),
    };
}

export function getMostFurthestDate(dates: Date[], now: Date): Date | null {
    if (dates.length === 0) {
        return null;
    }

    let furthestDate = dates[0];
    let maxDifference = Math.abs(differenceInMilliseconds(furthestDate, now));

    for (const date of dates) {
        const diff = Math.abs(differenceInMilliseconds(date, now));
        if (diff > maxDifference) {
            maxDifference = diff;
            furthestDate = date;
        }
    }

    return furthestDate;
}

export function checkAllLimits(checkins: CheckinItem[], now: Date): AllLimitCheckResult {
    const m2 = checkLimits(checkins, now, 5, 2, 'minutes');
    const m15 = checkLimits(checkins, now, 8, 15, 'minutes');
    const d1 = checkLimits(checkins, now, 50, 1, 'days');

    const isLimited = [m2.isLimited, m15.isLimited, d1.isLimited].some(Boolean);
    const unLimitingAts = [m2.unLimitingAt, m15.unLimitingAt, d1.unLimitingAt].filter(
        (value): value is Date => value != null,
    );

    return {
        limits: {
            m2,
            m15,
            d1,
        },
        isLimited,
        unLimitingAts: getMostFurthestDate(unLimitingAts, now),
    };
}

export function getNextJstMidnight(now: Date): Date {
    const zonedNow = toZonedTime(now, 'Asia/Tokyo');
    return fromZonedTime(startOfDay(addDays(zonedNow, 1)), 'Asia/Tokyo');
}

export function getNextRefreshAt(checkins: CheckinItem[], now: Date): Date {
    const m2 = checkLimits(checkins, now, 5, 2, 'minutes');
    const m15 = checkLimits(checkins, now, 8, 15, 'minutes');
    const d1 = checkLimits(checkins, now, 50, 1, 'days');
    const isLimited = [m2.isLimited, m15.isLimited, d1.isLimited].some(Boolean);

    if (!isLimited) {
        const oldestUnLimitingAts = [m2, m15, d1]
            .filter((result) => result.checkins.length > 0)
            .map((result) => {
                const [firstCheckin, ...restCheckins] = result.checkins;
                const oldestCheckin = restCheckins.reduce((oldest, checkin) => {
                    return checkin.createdAt < oldest.createdAt ? checkin : oldest;
                }, firstCheckin);

                return addPeriod(createdAt2Date(oldestCheckin.createdAt), result.period.value, result.period.unit);
            })
            .filter((value) => isAfter(value, now));

        if (oldestUnLimitingAts.length > 0) {
            return oldestUnLimitingAts.reduce((nearest, candidate) => {
                return candidate.getTime() < nearest.getTime() ? candidate : nearest;
            });
        }
    }

    const nextMidnight = getNextJstMidnight(now);
    const candidates = [nextMidnight, m2.unLimitingAt, m15.unLimitingAt, d1.unLimitingAt].filter(
        (value): value is Date => value != null && isAfter(value, now),
    );

    return candidates.reduce((nearest, candidate) => {
        return candidate.getTime() < nearest.getTime() ? candidate : nearest;
    }, nextMidnight);
}

export function getAutoFetchComparisonCount(result: AllLimitCheckResult): number {
    return Math.max(...Object.values(result.limits).map((limit) => limit.checkins.length));
}

export function getNextAutoFetchAt(result: AllLimitCheckResult, fetchedAt: Date, intervalSeconds: number): Date {
    if (result.isLimited && result.unLimitingAts != null) {
        return add(result.unLimitingAts, { seconds: intervalSeconds });
    }

    return add(fetchedAt, { seconds: intervalSeconds });
}

export function evaluateAutoFetchStability(
    state: AutoFetchStabilityState,
    currentCount: number,
): AutoFetchStabilityEvaluation {
    // 初回は比較対象を作るだけにして、即座に停止カウントを進めない。
    if (state.previousCount == null) {
        return {
            previousCount: currentCount,
            unchangedCount: 0,
            shouldDisable: false,
        };
    }

    if (state.previousCount !== currentCount) {
        return {
            previousCount: currentCount,
            unchangedCount: 0,
            shouldDisable: false,
        };
    }

    const unchangedCount = state.unchangedCount + 1;

    return {
        previousCount: currentCount,
        unchangedCount,
        shouldDisable: unchangedCount >= 3,
    };
}

export function getJstDayRange(target: Date) {
    const zonedTarget = toZonedTime(target, 'Asia/Tokyo');
    const start = fromZonedTime(startOfDay(zonedTarget), 'Asia/Tokyo');
    const end = fromZonedTime(endOfDay(zonedTarget), 'Asia/Tokyo');

    return { start, end };
}

export function subDays(date: Date, days: number): Date {
    return subDateFnsDays(date, days);
}
