import type { Metadata } from 'next';
import { TimesCarEstimateComparisonPage } from '@/components/times-car-estimate-comparison/times-car-estimate-comparison-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'タイムズカー/タイムズカーレンタル概算比較';
const description = 'タイムズカーとタイムズカーレンタルの料金を入力値から概算比較するページ。';

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
