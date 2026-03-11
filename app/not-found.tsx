import { Stack, Text, Title } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';
import { SitePageFrame } from '@/components/common/site-page-frame';

export default function NotFoundPage() {
    return (
        <SitePageFrame>
            <Stack gap="md">
                <Title order={1}>404 Not Found - hiroxto.net</Title>
                <Text>
                    <InternalLink href="/">トップページへ</InternalLink>
                </Text>
            </Stack>
        </SitePageFrame>
    );
}
