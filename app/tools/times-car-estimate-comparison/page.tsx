import type { Metadata } from 'next';
import { TimesCarEstimateComparisonPage } from '@/components/times-car-estimate-comparison/times-car-estimate-comparison-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'タイムズカー概算比較';
const description =
    'タイムズカーのカーシェアとタイムズカーレンタルの料金を、利用料金・距離・燃費・ガソリン単価から概算比較できるページ。';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/times-car-estimate-comparison', requestOrigin);

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

export default function TimesCarEstimateComparisonToolPage() {
    return <TimesCarEstimateComparisonPage />;
}
