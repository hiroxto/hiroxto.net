import type { Metadata } from 'next';
import { TokyoMetroTransferRoutePlannerPage } from '@/components/tokyometro-transfer-route-planner/tokyometro-transfer-route-planner-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = '東京メトロ 改札外乗換経路作成';
const description = '東京メトロの改札外乗換経路を作成する';
export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/tokyometro-transfer-route-planner', siteOrigin),
        type: 'website',
    },
};
export default function TokyoMetroTransferRoutePlannerToolPage() {
    return <TokyoMetroTransferRoutePlannerPage />;
}
