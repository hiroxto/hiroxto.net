import { Anchor, Container, Group, List, ListItem, Stack, Text, Title } from '@mantine/core';
import type { Metadata } from 'next';

const title = 'ツール一覧';
const description = 'hiroxto.netで公開しているツール一覧';
const pageUrl = 'https://hiroxto.net/tools';

const tools = [
    {
        href: '/tools/train-number-calc',
        title: '列車番号から列車種別を計算',
    },
] as const;

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: pageUrl,
        type: 'website',
    },
};

export default function ToolsPage() {
    return (
        <div className="bg-white py-8 text-[#161616]">
            <Container size="md">
                <Stack gap="lg">
                    <header>
                        <Group gap="sm">
                            <Anchor href="/">トップページ</Anchor>
                        </Group>
                    </header>

                    <section>
                        <Title order={1}>ツール一覧</Title>
                    </section>

                    <section>
                        <List listStyleType="disc" withPadding>
                            {tools.map((tool) => (
                                <ListItem key={tool.href}>
                                    <Anchor href={tool.href}>{tool.title}</Anchor>
                                </ListItem>
                            ))}
                        </List>
                    </section>
                </Stack>
            </Container>
        </div>
    );
}
