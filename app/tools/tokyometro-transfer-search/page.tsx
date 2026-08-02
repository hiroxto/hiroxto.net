import type { Metadata } from 'next';
import { TokyoMetroTransferSearchPage } from '@/components/tokyometro-transfer-search/tokyometro-transfer-search-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';
import {
    parseTokyoMetroTransferSearchParams,
    type TokyoMetroTransferSearchParams,
} from '@/lib/tokyometro-transfer-search/search-params';

const title = '東京メトロ 改札外乗換検索';
const description = '東京メトロの改札外乗換を最大化するルートを検索する';

interface TokyoMetroTransferSearchToolPageProps {
    searchParams: Promise<TokyoMetroTransferSearchParams>;
}

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/tokyometro-transfer-search', requestOrigin);

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

export default async function TokyoMetroTransferSearchToolPage({
    searchParams,
}: TokyoMetroTransferSearchToolPageProps) {
    const params = await searchParams;
    const { fromStationId, toStationId, maximumOutsideTransferCount, error } =
        parseTokyoMetroTransferSearchParams(params);

    return (
        <TokyoMetroTransferSearchPage
            initialFrom={fromStationId}
            initialTo={toStationId}
            initialMaximumOutsideTransferCount={maximumOutsideTransferCount}
            queryError={error}
        />
    );
}
