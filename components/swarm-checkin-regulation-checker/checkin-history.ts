import { createdAt2Date, getJstDayRange, subDays } from '@/lib/swarm-checkin-regulation-checker/functions';
import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

export interface HistoryTarget {
    key: string;
    title: string;
    periodFrom: Date;
    periodTo: Date;
    checkins: CheckinItem[];
}

export const filterCheckinsByPeriod = (checkins: CheckinItem[], periodFrom: Date, periodTo: Date) => {
    return checkins.filter((checkin) => {
        const checkinDate = createdAt2Date(checkin.createdAt).getTime();
        return checkinDate >= periodFrom.getTime() && checkinDate <= periodTo.getTime();
    });
};

export const createHistoryTargets = (checkins: CheckinItem[], now: Date): HistoryTarget[] => {
    return [0, 1, 2].map((daysAgo) => {
        const targetDate = subDays(now, daysAgo);
        const { start, end } = getJstDayRange(targetDate);

        return {
            key: `d${daysAgo}`,
            title: daysAgo === 0 ? '本日のチェックイン一覧' : `${daysAgo}日前のチェックイン一覧`,
            periodFrom: start,
            periodTo: end,
            checkins: filterCheckinsByPeriod(checkins, start, end),
        };
    });
};
