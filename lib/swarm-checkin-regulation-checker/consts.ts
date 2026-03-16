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
