import type { Metadata } from 'next';
import { TrainNumberIndexPage } from '@/components/train-number/train-number-index-page';
import { siteOrigin } from '@/lib/metadata/site-origin';
import { trainNumberIndexDescription, trainNumberIndexTitle } from '@/lib/train-number/page-config';

export const metadata: Metadata = {
    title: trainNumberIndexTitle,
    description: trainNumberIndexDescription,
    openGraph: {
        title: trainNumberIndexTitle,
        description: trainNumberIndexDescription,
        url: new URL('/tools/train-number', siteOrigin),
        type: 'website',
    },
};

export default function TrainNumberIndexToolPage() {
    return <TrainNumberIndexPage />;
}
