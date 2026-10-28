import { Card, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CalculatorIcon } from '@phosphor-icons/react/dist/ssr/Calculator';
import { CarIcon } from '@phosphor-icons/react/dist/ssr/Car';
import { ContactlessPaymentIcon } from '@phosphor-icons/react/dist/ssr/ContactlessPayment';
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { NotebookIcon } from '@phosphor-icons/react/dist/ssr/Notebook';
import { PathIcon } from '@phosphor-icons/react/dist/ssr/Path';
import { PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone';
import { QrCodeIcon } from '@phosphor-icons/react/dist/ssr/QrCode';
import { TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { TrainIcon } from '@phosphor-icons/react/dist/ssr/Train';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { siteOrigin } from '@/lib/metadata/site-origin';
import { trainNumberIndexDescription, trainNumberIndexTitle } from '@/lib/train-number/page-config';

const title = 'Tools';
const description = '便利(?)ツール類';

/*
 * ツールを追加する際は、ユーザーに一覧内の追加位置を指定してもらうこと。
 * 追加位置が未指定の場合は、独自に決めずユーザーに確認すること。
 * title と description は、遷移先ページの内容をそのまま使うこと。
 * icon は、ツールの内容に最適なアイコンを選択すること。
 */
const tools = [
    {
        href: '/tools/tokyometro-transfer-search',
        title: '東京メトロ 改札外乗換検索',
        description: '東京メトロの改札外乗換を最大化するルートを検索する',
        icon: TrainIcon,
    },
    {
        href: '/tools/tokyometro-transfer-route-planner',
        title: '東京メトロ 改札外乗換経路作成',
        description: '東京メトロの改札外乗換経路を作成する',
        icon: PathIcon,
    },
    {
        href: '/tools/fare-ticket-route-planner',
        title: '乗車券の経路作成',
        description: '複雑な経路の乗車券を作る際の補助ツール',
        icon: TicketIcon,
    },
    {
        href: '/tools/cl-sound',
        title: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生',
        description: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生',
        icon: ContactlessPaymentIcon,
    },
    {
        href: '/tools/dtmf',
        title: 'DTMF',
        description: 'WebAudio APIでDTMFの合成信号音を再生',
        icon: PhoneIcon,
    },
    {
        href: '/tools/times-car-estimate-comparison',
        title: 'タイムズカー/タイムズカーレンタル概算比較',
        description: 'タイムズカーとタイムズカーレンタルの料金を入力値から概算比較するページ。',
        icon: CarIcon,
    },
    {
        href: '/tools/train-number-calc',
        title: '列車番号から列車種別を計算',
        description: '列車番号から列車種別(特急客, 臨急客, 臨特急客, 高速貨A, 臨専貨A, など)を計算できるページ。',
        icon: CalculatorIcon,
    },
    {
        href: '/tools/qr-code-gen',
        title: 'QRコード生成',
        description: 'ブラウザでQRコードを生成。',
        icon: QrCodeIcon,
    },
    {
        href: '/tools/swarm-checkin-regulation-checker',
        title: 'Swarm コイン規制チェッカー',
        description: 'Swarmでチェックインした際に貰えるコインが規制されているかを確認するツール。',
        icon: MapPinIcon,
    },
    {
        href: '/tools/train-number',
        title: trainNumberIndexTitle,
        description: trainNumberIndexDescription,
        icon: NotebookIcon,
    },
] as const;

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title,
        description,
        url: new URL('/tools', siteOrigin),
        type: 'website',
    },
};

export default function ToolsPage() {
    return (
        <SiteSubpageFrame items={[{ label: 'Tools' }]} title={title} description={description}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {tools.map((tool) => (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        aria-label={tool.title}
                        className="rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#495057]"
                    >
                        <Card withBorder radius="md" padding="lg" component="article" h="100%">
                            <Stack gap="md">
                                <ThemeIcon size={44} radius="md" variant="light" color="gray">
                                    <tool.icon size={26} aria-hidden="true" />
                                </ThemeIcon>
                                <div>
                                    <Title order={2} size="h4" c="dark.8" fw={600}>
                                        {tool.title}
                                    </Title>
                                    <Text size="sm" c="dark.6" mt="xs" lh={1.7}>
                                        {tool.description}
                                    </Text>
                                </div>
                            </Stack>
                        </Card>
                    </Link>
                ))}
            </SimpleGrid>
        </SiteSubpageFrame>
    );
}
