import type { Metadata } from 'next';
import { EpgsRecordedNamePage } from '@/components/epgs-recorded-name/epgs-recorded-name-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = '録画サーバーの保存先のパスを生成';
const description = '録画サーバーの保存先のパスを生成する';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/epgs-recorded-name', requestOrigin);

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

export default function EpgsRecordedNameToolPage() {
    return <EpgsRecordedNamePage />;
}
