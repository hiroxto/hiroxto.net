import type { Metadata } from 'next';
import { DtmfPage } from '@/components/dtmf/dtmf-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'DTMF';
const description = 'WebAudio APIでDTMFの合成信号音を再生';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/dtmf', requestOrigin);

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

export default function DtmfToolPage() {
    return <DtmfPage />;
}
