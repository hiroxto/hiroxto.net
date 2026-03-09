'use client';

import { Container, Stack, Text, Title } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';

export default function ErrorPage() {
    return (
        <div className="bg-white py-8 text-[#161616]">
            <Container size="lg">
                <Stack gap="md">
                    <Title order={1}>Something went wrong!</Title>
                    <Text>
                        <InternalLink href="/">トップページへ</InternalLink>
                    </Text>
                </Stack>
            </Container>
        </div>
    );
}
