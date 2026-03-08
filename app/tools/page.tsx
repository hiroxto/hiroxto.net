import { Container, Group, List, ListItem, Stack, Text, Title } from '@mantine/core';
import type { Metadata } from 'next';
import { InternalLink } from '@/components/common/internal-link';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'ツール一覧';
const description = 'hiroxto.netで公開しているツール一覧';

const tools = [
    {
        href: '/tools/train-number-calc',
        title: '列車番号から列車種別を計算',
    },
] as const;

export async function generateMetadata(): Promise<Metadata> {
    const requestOrigin = await getRequestOrigin();
    const pageUrl = new URL('/tools', requestOrigin);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: pageUrl,
            type: 'website',
        },
    };
}

export default function ToolsPage() {
    return (
        <div className="bg-white py-8 text-[#161616]">
            <Container size="md">
                <Stack gap="lg">
                    <header>
                        <Group gap="sm">
                            <InternalLink href="/">トップページ</InternalLink>
                            <Text c="dimmed">/</Text>
                            <InternalLink href="/tools">ツール一覧</InternalLink>
                        </Group>
                    </header>

                    <section>
                        <Title order={1}>ツール一覧</Title>
                    </section>

                    <section>
                        <List listStyleType="disc" withPadding>
                            {tools.map((tool) => (
                                <ListItem key={tool.href}>
                                    <InternalLink href={tool.href}>{tool.title}</InternalLink>
                                </ListItem>
                            ))}
                        </List>
                    </section>
                </Stack>
            </Container>
        </div>
    );
}
