'use client';

import { Stack, Text, Title } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';
import { SitePageFrame } from '@/components/common/site-page-frame';

export default function ErrorPage() {
    return (
        <SitePageFrame>
            <Stack gap="md">
                <Title order={1}>Something went wrong!</Title>
                <Text>
                    <InternalLink href="/">トップページへ</InternalLink>
                </Text>
            </Stack>
        </SitePageFrame>
    );
}
