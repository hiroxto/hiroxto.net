import type { CheckinLimits, ResultKey } from '@/lib/swarm-checkin-regulation-checker/types';

type CheckinLimitTitles = {
    [K in keyof CheckinLimits]: string;
};

export const CHECKIN_LIMIT_TITLES: CheckinLimitTitles = {
    m2: '2分間に5回のチェックイン',
    m15: '15分間に8回のチェックイン',
    d1: '1日(24時間)に50回のチェックイン',
} as const;

export const RESULT_KEYS: ResultKey[] = ['m2', 'm15', 'd1'];

export const AUTO_FETCH_INTERVAL_OPTIONS = [
    { value: '5', label: '5秒' },
    { value: '10', label: '10秒' },
    { value: '30', label: '30秒' },
    { value: '60', label: '1分' },
] as const;
