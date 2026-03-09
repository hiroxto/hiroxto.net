'use client';

import '@mantine/core/styles.css';
import { Container, MantineProvider, Stack, Text, Title } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';

export default function GlobalErrorPage() {
    return (
        <html lang="ja-JP">
            <body>
                <MantineProvider>
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
                </MantineProvider>
            </body>
        </html>
    );
}
