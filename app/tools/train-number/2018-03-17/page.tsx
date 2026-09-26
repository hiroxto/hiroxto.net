import type { Metadata } from 'next';
import { TrainNumberPage } from '@/components/train-number/train-number-page';
import { siteOrigin } from '@/lib/metadata/site-origin';
import { loadTrainNumberContent } from '@/lib/train-number/load-train-number-content';

const title = '2018年3月17日 改正';
const description = `列車番号メモ ${title}`;

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/train-number/2018-03-17', siteOrigin),
        type: 'website',
    },
};

export default function TrainNumber20180317Page() {
    const markdownSource = loadTrainNumberContent('2018-03-17.md');

    return <TrainNumberPage title={title} markdownSource={markdownSource} />;
}
