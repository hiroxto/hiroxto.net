import { describe, expect, test } from 'vitest';
import {
    createHistoryTargets,
    filterCheckinsByPeriod,
} from '@/components/swarm-checkin-regulation-checker/checkin-history';
import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

const createCheckin = (id: string, createdAt: string): CheckinItem => ({
    id,
    createdAt: Math.floor(new Date(createdAt).getTime() / 1000),
    type: 'checkin',
    timeZoneOffset: 540,
    venue: {
        id: `venue-${id}`,
        name: `venue-${id}`,
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
});

describe('checkin history', () => {
    test('期間内のチェックインだけを返すこと', () => {
        const checkins = [
            createCheckin('1', '2026-03-17T01:00:00+09:00'),
            createCheckin('2', '2026-03-18T01:00:00+09:00'),
        ];

        const filtered = filterCheckinsByPeriod(
            checkins,
            new Date('2026-03-17T00:00:00+09:00'),
            new Date('2026-03-17T23:59:59+09:00'),
        );

        expect(filtered.map((checkin) => checkin.id)).toEqual(['1']);
    });

    test('当日から2日前までの履歴枠を作ること', () => {
        const checkins = [
            createCheckin('today', '2026-03-17T12:00:00+09:00'),
            createCheckin('yesterday', '2026-03-16T12:00:00+09:00'),
        ];

        const targets = createHistoryTargets(checkins, new Date('2026-03-17T18:00:00+09:00'));

        expect(targets.map((target) => target.key)).toEqual(['d0', 'd1', 'd2']);
        expect(targets[0]?.checkins.map((checkin) => checkin.id)).toEqual(['today']);
        expect(targets[1]?.checkins.map((checkin) => checkin.id)).toEqual(['yesterday']);
        expect(targets[2]?.checkins).toEqual([]);
    });
});
