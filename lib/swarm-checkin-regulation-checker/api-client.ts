import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

interface CheckinsResponseBody {
    checkins: CheckinItem[];
}

export class SwarmCheckinRegulationCheckerApiClient {
    constructor(private readonly token: string) {}

    async getSelfCheckins(): Promise<CheckinItem[]> {
        const response = await fetch('/api/swarm-checkin-regulation-checker/checkins', {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`API Call Error: ${response.status}`);
        }

        const body = (await response.json()) as CheckinsResponseBody;
        return body.checkins;
    }
}
