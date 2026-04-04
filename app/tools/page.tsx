import { List, ListItem, Stack } from '@mantine/core';
import type { Metadata } from 'next';
import { InternalLink } from '@/components/common/internal-link';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const title = 'ツール一覧';
const description = 'hiroxto.netで公開しているツール一覧';

const tools = [
    {
        href: '/tools/japan-airport-search',
        title: '日本の飛行場・空港検索',
    },
    {
        href: '/tools/fare-ticket-route-planner',
        title: '乗車券の経路作成',
    },
    {
        href: '/tools/cl-sound',
        title: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生',
    },
    {
        href: '/tools/train-number-calc',
        title: '列車番号から列車種別を計算',
    },
    {
        href: '/tools/train-number',
        title: '列車番号メモ',
    },
    {
        href: '/tools/qr-code-gen',
        title: 'QRコード生成',
    },
    {
        href: '/tools/swarm-checkin-regulation-checker',
        title: 'Swarm コイン規制チェッカー',
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
        <SiteSubpageFrame items={[{ label: 'ツール一覧' }]} title={title} description={description}>
            <Stack gap="lg">
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
        </SiteSubpageFrame>
    );
}
