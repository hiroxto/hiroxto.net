import type { Metadata } from 'next';
import { CarshareRentacarEstimateComparisonPage } from '@/components/carshare-rentacar-estimate-comparison/carshare-rentacar-estimate-comparison-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = 'カーシェア・レンタカー概算比較';
const description = 'タイムズカーとタイムズカーレンタルの料金を入力値から概算比較するページ。';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/carshare-rentacar-estimate-comparison', siteOrigin),
        type: 'website',
    },
};

export default function CarshareRentacarEstimateComparisonToolPage() {
    return <CarshareRentacarEstimateComparisonPage />;
}
