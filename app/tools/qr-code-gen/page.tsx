import type { Metadata } from 'next';
import { QrCodeGenPage } from '@/components/qr-code-gen/qr-code-gen-page';
import { siteOrigin } from '@/lib/metadata/site-origin';

const title = 'QRコード生成';
const description = 'ブラウザでQRコードを生成。';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools/qr-code-gen', siteOrigin),
        type: 'website',
    },
};

export default function QrCodeGenToolPage() {
    return <QrCodeGenPage />;
}
