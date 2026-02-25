import 'carbon-components/css/carbon-components.min.css';
import './globals.css';
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
            <body>{children}</body>
        </html>
    );
}
