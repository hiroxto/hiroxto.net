import { NextResponse } from 'next/server';
import { FoursquareApiError, FoursquareClient } from '@/lib/swarm-checkin-regulation-checker/foursquare';

const getBearerToken = (authorization: string | null): string | null => {
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    return match?.[1] ?? null;
};

export async function GET(request: Request) {
    const token = getBearerToken(request.headers.get('authorization'));

    if (token == null || token === '') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const checkins = await new FoursquareClient(token).getSelfCheckins();
        return NextResponse.json({ checkins });
    } catch (error) {
        if (error instanceof FoursquareApiError) {
            return NextResponse.json({ message: error.message }, { status: error.status });
        }

        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
