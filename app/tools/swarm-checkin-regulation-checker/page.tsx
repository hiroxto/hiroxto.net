import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SwarmCheckinRegulationCheckerPage } from '@/components/swarm-checkin-regulation-checker/swarm-checkin-regulation-checker-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = 'Swarm コイン規制チェッカー';
const description = 'Swarmでチェックインした際に貰えるコインが規制されているかを確認するツール。';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/swarm-checkin-regulation-checker', siteOrigin),
        type: 'website',
    },
};

export default function SwarmCheckinRegulationCheckerToolPage() {
    return (
        <Suspense fallback={null}>
            <SwarmCheckinRegulationCheckerPage />
        </Suspense>
    );
}
