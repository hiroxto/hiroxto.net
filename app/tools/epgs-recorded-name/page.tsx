import type { Metadata } from 'next';
import { EpgsRecordedNamePage } from '@/components/epgs-recorded-name/epgs-recorded-name-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = '録画サーバー用の保存先パスを生成';
const description = '録画サーバー用の保存先パスを生成する';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/epgs-recorded-name', siteOrigin),
        type: 'website',
    },
};

export default function EpgsRecordedNameToolPage() {
    return <EpgsRecordedNamePage />;
}
