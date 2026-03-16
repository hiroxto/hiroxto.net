import type { CheckinItem, CheckinResponseBody } from '@/lib/swarm-checkin-regulation-checker/types';

export class FoursquareClient {
    constructor(private readonly token: string) {}

    async getSelfCheckins(): Promise<CheckinItem[]> {
        const endpoint = new URL('https://api.foursquare.com/v2/users/self/checkins');
        endpoint.searchParams.set('oauth_token', this.token);
        endpoint.searchParams.set('limit', '200');
        endpoint.searchParams.set('v', '20221016');
        endpoint.searchParams.set('lang', 'ja');

        const response = await fetch(endpoint, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`API Call Error: ${response.status}`);
        }

        const body = (await response.json()) as CheckinResponseBody;
        return body.response.checkins.items;
    }
}
