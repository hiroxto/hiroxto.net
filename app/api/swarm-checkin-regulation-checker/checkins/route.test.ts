import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FoursquareApiError } from '@/lib/swarm-checkin-regulation-checker/foursquare';
import { GET } from './route';

const { getSelfCheckinsMock } = vi.hoisted(() => ({
    getSelfCheckinsMock: vi.fn(),
}));

vi.mock('@/lib/swarm-checkin-regulation-checker/foursquare', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/swarm-checkin-regulation-checker/foursquare')>();

    return {
        ...actual,
        FoursquareClient: class {
            getSelfCheckins = getSelfCheckinsMock;
        },
    };
});

describe('GET /api/swarm-checkin-regulation-checker/checkins', () => {
    beforeEach(() => {
        getSelfCheckinsMock.mockReset();
    });

    test('Authorization ヘッダーがない場合は 401 を返すこと', async () => {
        const response = await GET(new Request('http://localhost/api/swarm-checkin-regulation-checker/checkins'));

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });

    test('Foursquare のチェックイン一覧を返すこと', async () => {
        getSelfCheckinsMock.mockResolvedValue([{ id: 'checkin-1' }]);

        const response = await GET(
            new Request('http://localhost/api/swarm-checkin-regulation-checker/checkins', {
                headers: {
                    Authorization: 'Bearer test-token',
                },
            }),
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ checkins: [{ id: 'checkin-1' }] });
    });

    test('Foursquare API エラー時は status を引き継ぐこと', async () => {
        getSelfCheckinsMock.mockRejectedValue(new FoursquareApiError(403));

        const response = await GET(
            new Request('http://localhost/api/swarm-checkin-regulation-checker/checkins', {
                headers: {
                    Authorization: 'Bearer invalid-token',
                },
            }),
        );

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ message: 'API Call Error: 403' });
    });
});
