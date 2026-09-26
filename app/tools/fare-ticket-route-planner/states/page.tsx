import type { Metadata } from 'next';
import { SavedRoutesPage } from '@/components/fare-ticket-route-planner/saved-routes-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = '保存済み経路';
const description = '保存した経路の一覧と操作';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/fare-ticket-route-planner/states', siteOrigin),
        type: 'website',
    },
};

export default function FareTicketRoutePlannerStatesPage() {
    return <SavedRoutesPage />;
}
