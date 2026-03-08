import '@mantine/core/styles.css';
import './globals.css';
import { MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: {
        template: '%s | hiroxto.net',
        default: 'hiroxto.net',
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
