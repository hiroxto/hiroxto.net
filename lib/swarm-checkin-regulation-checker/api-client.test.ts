import { afterEach, describe, expect, test, vi } from 'vitest';
import { SwarmCheckinRegulationCheckerApiClient } from '@/lib/swarm-checkin-regulation-checker/api-client';

describe('SwarmCheckinRegulationCheckerApiClient', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('同一オリジンのAPIへ認証情報付きで自己チェックイン一覧を取得する', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                checkins: [{ id: 'checkin-1' }],
            }),
        } as Response);

        const client = new SwarmCheckinRegulationCheckerApiClient('test-token');
        const result = await client.getSelfCheckins();

        expect(result).toEqual([{ id: 'checkin-1' }]);
        expect(fetchMock).toHaveBeenCalledWith('/api/swarm-checkin-regulation-checker/checkins', {
            headers: {
                Authorization: 'Bearer test-token',
            },
            method: 'GET',
        });
    });

    test('API エラー時は status を含む例外を投げる', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 401,
        } as Response);

        const client = new SwarmCheckinRegulationCheckerApiClient('invalid-token');

        await expect(client.getSelfCheckins()).rejects.toThrow('API Call Error: 401');
    });
});
