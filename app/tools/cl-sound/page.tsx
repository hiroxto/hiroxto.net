import type { Metadata } from 'next';
import { ClSoundPage } from '@/components/cl-sound/cl-sound-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = 'EMVコンタクトレスのサウンドをWeb Audio APIで再生';
const description = 'EMVコンタクトレスのサウンドをWeb Audio APIで再生';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/cl-sound', siteOrigin),
        type: 'website',
        images: [new URL('/assets/tools/cl-sound/ogp-default.png', siteOrigin)],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@hiroxto',
        images: [new URL('/assets/tools/cl-sound/ogp-default.png', siteOrigin)],
    },
};

export default function ClSoundToolPage() {
    return <ClSoundPage />;
}
