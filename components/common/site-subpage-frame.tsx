import type { ContainerProps } from '@mantine/core';
import { Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { SiteBreadcrumbs } from '@/components/common/site-breadcrumbs';
import { SitePageFrame } from '@/components/common/site-page-frame';

interface SiteSubpageItem {
    label: string;
    href?: string;
}

// 共通のパンくずはキーで指定し、文言とリンク先をここで管理する。
// ページ固有の階層・現在地は従来どおりオブジェクトで指定する。
const breadcrumbItems = {
    tools: { label: 'Tools', href: '/tools' },
} satisfies Record<string, SiteSubpageItem>;

interface SiteSubpageFrameProps {
    children: ReactNode;
    items: (keyof typeof breadcrumbItems | SiteSubpageItem)[];
    title: string;
    description: string;
    pageSize?: ContainerProps['size'];
}

export function SiteSubpageFrame({ children, items, title, description, pageSize }: SiteSubpageFrameProps) {
    const resolvedItems = items.map((item) => (typeof item === 'string' ? breadcrumbItems[item] : item));

    return (
        <SitePageFrame size={pageSize}>
            <Stack gap="xl">
                <header>
                    <SiteBreadcrumbs items={[{ label: 'Top page', href: '/' }, ...resolvedItems]} />
                </header>
                <section>
                    <Title order={1}>{title}</Title>
                    <Text mt="xs">{description}</Text>
                </section>
                {children}
            </Stack>
        </SitePageFrame>
    );
}
