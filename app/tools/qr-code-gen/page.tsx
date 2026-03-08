import type { Metadata } from 'next';
import { QrCodeGenPage } from '@/components/qr-code-gen/qr-code-gen-page';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'QRコード生成';
const description = 'ブラウザでQRコードを生成。';

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools/qr-code-gen', requestOrigin);

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

export default function QrCodeGenToolPage() {
    return <QrCodeGenPage />;
}
