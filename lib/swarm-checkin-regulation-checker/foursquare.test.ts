import { afterEach, describe, expect, test, vi } from 'vitest';
import { FoursquareClient } from '@/lib/swarm-checkin-regulation-checker/foursquare';

describe('FoursquareClient', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('認証情報付きで自己チェックイン一覧を取得する', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                response: {
                    checkins: {
                        items: [{ id: 'checkin-1' }],
                    },
                },
            }),
        } as Response);

        const client = new FoursquareClient('test-token');
        const result = await client.getSelfCheckins();

        expect(result).toEqual([{ id: 'checkin-1' }]);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, options] = fetchMock.mock.calls[0] ?? [];
        expect(url).toBeInstanceOf(URL);
        expect((url as URL).toString()).toBe(
            'https://api.foursquare.com/v2/users/self/checkins?oauth_token=test-token&limit=200&v=20221016&lang=ja',
        );
        expect(options).toEqual({ method: 'GET' });
    });

    test('API エラー時は status を含む例外を投げる', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 401,
        } as Response);

        const client = new FoursquareClient('invalid-token');

        await expect(client.getSelfCheckins()).rejects.toThrow('API Call Error: 401');
    });
});
