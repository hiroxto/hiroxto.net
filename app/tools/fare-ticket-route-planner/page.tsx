import type { Metadata } from 'next';
import { FareTicketRoutePlannerPage } from '@/components/fare-ticket-route-planner/fare-ticket-route-planner-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = '乗車券の経路作成';
const description = '複雑な経路の乗車券作る際の補助ツール';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/fare-ticket-route-planner', requestOrigin);

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

export default function FareTicketRoutePlannerToolPage() {
    return <FareTicketRoutePlannerPage />;
}
