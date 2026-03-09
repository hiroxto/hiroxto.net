import '@mantine/core/styles.css';
import './globals.css';
import { MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

interface RootLayoutProps {
    children: ReactNode;
}

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();

    return {
        metadataBase: requestOrigin,
        title: {
            template: '%s | hiroxto.net',
            default: 'hiroxto.net',
        },
    };
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="ja-JP">
            <head>
                <link rel="author" type="text/plain" href="/humans.txt" />
            </head>
            <body>
                <MantineProvider>{children}</MantineProvider>
            </body>
        </html>
    );
}
