import type { Metadata } from 'next';
import { JapanAirportSearchPage } from '@/components/japan-airport-search/japan-airport-search-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = '日本の飛行場・空港検索';
const description = '日本の飛行場・空港を名称、ICAO空港コード、IATA空港コードで検索できるページ。';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/japan-airport-search', siteOrigin),
        type: 'website',
    },
};

export default function JapanAirportSearchToolPage() {
    return <JapanAirportSearchPage />;
}
