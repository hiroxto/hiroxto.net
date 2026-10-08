'use client';

import '@mantine/core/styles.css';
import { Stack, Text, Title } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';
import { SiteMantineProvider } from '@/components/common/site-mantine-provider';
import { SitePageFrame } from '@/components/common/site-page-frame';

export default function GlobalErrorPage() {
    return (
        <html lang="ja-JP">
            <body>
                <SiteMantineProvider>
                    <SitePageFrame>
                        <Stack gap="md">
                            <Title order={1}>Something went wrong!</Title>
                            <Text>
                                <InternalLink href="/">トップページへ</InternalLink>
                            </Text>
                        </Stack>
                    </SitePageFrame>
                </SiteMantineProvider>
            </body>
        </html>
    );
}
