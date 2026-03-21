import type { Metadata } from 'next';
import { TrainNumberPage } from '@/components/train-number/train-number-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';
import { loadTrainNumberContent } from '@/lib/train-number/load-train-number-content';

const title = '2020年3月14日 改正';
const description = `列車番号メモ ${title}`;

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/train-number/2020-03-14', requestOrigin);

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

export default function TrainNumber20200314Page() {
    const markdownSource = loadTrainNumberContent('2020-03-14.md');

    return <TrainNumberPage title={title} markdownSource={markdownSource} />;
}
