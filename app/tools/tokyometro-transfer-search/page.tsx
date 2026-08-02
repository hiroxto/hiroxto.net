import type { Metadata } from 'next';
import { TokyoMetroTransferSearchPage } from '@/components/tokyometro-transfer-search/tokyometro-transfer-search-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';
import {
    isStationId,
    isValidMaximumOutsideTransferCount,
    MAX_OUTSIDE_TRANSFER_COUNT,
} from '@/lib/tokyometro-transfer-search/search';

const title = '東京メトロ 改札外乗換検索';
const description = '東京メトロの改札外乗換を最大化するルートを検索する';

type SearchParams = Record<string, string | string[] | undefined>;

interface TokyoMetroTransferSearchToolPageProps {
    searchParams: Promise<SearchParams>;
}

const getSingleValue = (value: string | string[] | undefined): string | null =>
    typeof value === 'string' ? value : null;

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
    const fromValue = getSingleValue(params.from);
    const toValue = getSingleValue(params.to);
    const maximumOutsideTransferCountValue = getSingleValue(params.maxOutsideTransfers);
    const maximumOutsideTransferCount =
        maximumOutsideTransferCountValue == null ? null : Number(maximumOutsideTransferCountValue);
    const hasCompleteQuery = fromValue != null && toValue != null;
    const hasInvalidStation = hasCompleteQuery && (!isStationId(fromValue) || !isStationId(toValue));
    const hasInvalidMaximumOutsideTransferCount =
        maximumOutsideTransferCount != null && !isValidMaximumOutsideTransferCount(maximumOutsideTransferCount);
    const initialFrom = hasCompleteQuery && isStationId(fromValue) ? fromValue : null;
    const initialTo = hasCompleteQuery && isStationId(toValue) ? toValue : null;
    const queryError = hasInvalidMaximumOutsideTransferCount
        ? `最大改札外乗換回数は1〜${MAX_OUTSIDE_TRANSFER_COUNT}回で指定してください`
        : hasInvalidStation
          ? '指定された駅が見つかりません'
          : initialFrom != null && initialTo != null && initialFrom === initialTo
            ? '乗車駅と降車駅には異なる駅を指定してください'
            : null;

    return (
        <TokyoMetroTransferSearchPage
            initialFrom={queryError == null ? initialFrom : null}
            initialTo={queryError == null ? initialTo : null}
            initialMaximumOutsideTransferCount={queryError == null ? maximumOutsideTransferCount : null}
            queryError={queryError}
        />
    );
}
