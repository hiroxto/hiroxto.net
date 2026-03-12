import type { Metadata } from 'next';
import { SavedRoutesPage } from '@/components/fare-ticket-route-planner/saved-routes-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = '保存済み経路';
const description = '保存した経路の一覧と操作';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/fare-ticket-route-planner/states', requestOrigin);

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

export default function FareTicketRoutePlannerStatesPage() {
    return <SavedRoutesPage />;
}
