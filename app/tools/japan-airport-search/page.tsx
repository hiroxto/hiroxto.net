import type { Metadata } from 'next';
import { JapanAirportSearchPage } from '@/components/japan-airport-search/japan-airport-search-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = '日本の飛行場・空港検索';
const description = '日本の飛行場・空港を名称、ICAO空港コード、IATA空港コードで検索できるページ。';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/japan-airport-search', requestOrigin);

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

export default function JapanAirportSearchToolPage() {
    return <JapanAirportSearchPage />;
}
