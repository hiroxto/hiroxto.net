import '@mantine/core/styles.css';
import './globals.css';
import { MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'hiroxto.net',
    description: 'Code of www.hiroxto.net',
    openGraph: {
        title: 'hiroxto.net',
    },
    twitter: {
        card: 'summary',
    },
    robots: {
        index: false,
        nocache: true,
    },
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <head>
                <link rel="author" type="text/plain" href="/humans.txt" />
            </head>
            <body>
                <MantineProvider>{children}</MantineProvider>
            </body>
        </html>
    );
}
