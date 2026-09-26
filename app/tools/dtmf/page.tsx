import type { Metadata } from 'next';
import { DtmfPage } from '@/components/dtmf/dtmf-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = 'DTMF';
const description = 'WebAudio APIでDTMFの合成信号音を再生';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/dtmf', siteOrigin),
        type: 'website',
    },
};

export default function DtmfToolPage() {
    return <DtmfPage />;
}
