import type { Metadata } from 'next';
import { TrainNumberPage } from '@/components/train-number/train-number-page';
import { siteOrigin } from '@/lib/metadata/site-origin';
import { loadTrainNumberContent } from '@/lib/train-number/load-train-number-content';

const title = '2019年3月16日 改正';
const description = `列車番号メモ ${title}`;

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/train-number/2019-03-16', siteOrigin),
        type: 'website',
    },
};

export default function TrainNumber20190316Page() {
    const markdownSource = loadTrainNumberContent('2019-03-16.md');

    return <TrainNumberPage title={title} markdownSource={markdownSource} />;
}
