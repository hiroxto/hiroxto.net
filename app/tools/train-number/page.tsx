import type { Metadata } from 'next';
import { TrainNumberIndexPage } from '@/components/train-number/train-number-index-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';
import { trainNumberIndexDescription, trainNumberIndexTitle } from '@/lib/train-number/page-config';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/train-number', requestOrigin);

    return {
        title: trainNumberIndexTitle,
        description: trainNumberIndexDescription,
        openGraph: {
            title: trainNumberIndexTitle,
            description: trainNumberIndexDescription,
            url: pageUrl,
            type: 'website',
        },
    };
}

export default function TrainNumberIndexToolPage() {
    return <TrainNumberIndexPage />;
}
