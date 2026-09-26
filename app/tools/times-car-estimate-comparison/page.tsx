import type { Metadata } from 'next';
import { TimesCarEstimateComparisonPage } from '@/components/times-car-estimate-comparison/times-car-estimate-comparison-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = 'タイムズカー/タイムズカーレンタル概算比較';
const description = 'タイムズカーとタイムズカーレンタルの料金を入力値から概算比較するページ。';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/times-car-estimate-comparison', siteOrigin),
        type: 'website',
    },
};

export default function TimesCarEstimateComparisonToolPage() {
    return <TimesCarEstimateComparisonPage />;
}
