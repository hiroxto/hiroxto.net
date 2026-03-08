import type { Metadata } from 'next';
import { TrainNumberCalcPage } from '@/components/train-number-calc/train-number-calc-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = '列車番号から列車種別を計算';
const description = '列車番号から列車種別(特急客, 臨急客, 臨特急客, 高速貨A, 臨専貨A, など)を計算できるページ．';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/train-number-calc', requestOrigin);

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

export default function TrainNumberCalcToolPage() {
    return <TrainNumberCalcPage />;
}
