import type { Metadata } from 'next';
import { FareTicketRoutePlannerPage } from '@/components/fare-ticket-route-planner/fare-ticket-route-planner-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = '乗車券の経路作成';
const description = '複雑な経路の乗車券を作る際の補助ツール';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/fare-ticket-route-planner', siteOrigin),
        type: 'website',
    },
};

export default function FareTicketRoutePlannerToolPage() {
    return <FareTicketRoutePlannerPage />;
}
