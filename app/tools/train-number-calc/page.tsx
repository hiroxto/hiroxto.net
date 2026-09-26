import type { Metadata } from 'next';
import { TrainNumberCalcPage } from '@/components/train-number-calc/train-number-calc-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = '列車番号から列車種別を計算';
const description = '列車番号から列車種別(特急客, 臨急客, 臨特急客, 高速貨A, 臨専貨A, など)を計算できるページ。';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/train-number-calc', siteOrigin),
        type: 'website',
    },
};

export default function TrainNumberCalcToolPage() {
    return <TrainNumberCalcPage />;
}
