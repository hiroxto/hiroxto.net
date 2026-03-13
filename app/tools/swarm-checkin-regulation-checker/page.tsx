import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SwarmCheckinRegulationCheckerPage } from '@/components/swarm-checkin-regulation-checker/swarm-checkin-regulation-checker-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'Swarm コイン規制チェッカー';
const description = 'Swarmでチェックインした際に貰えるコインが規制されているかを確認するツール。';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/swarm-checkin-regulation-checker', requestOrigin);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: pageUrl,
            type: 'website',
        },
    };
}

export default function SwarmCheckinRegulationCheckerToolPage() {
    return (
        <Suspense fallback={null}>
            <SwarmCheckinRegulationCheckerPage />
        </Suspense>
    );
}
