import type { Metadata } from 'next';
import { ClSoundPage } from '@/components/cl-sound/cl-sound-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'EMVコンタクトレスのサウンドをWeb Audio APIで再生';
const description = 'EMVコンタクトレスのサウンドをWeb Audio APIで再生';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/cl-sound', requestOrigin);
    const ogImageUrl = new URL('/assets/tools/cl-sound/ogp-default.png', requestOrigin);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: pageUrl,
            type: 'website',
            images: [ogImageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            site: '@hiroxto',
            images: [ogImageUrl],
        },
    };
}

export default function ClSoundToolPage() {
    return <ClSoundPage />;
}
