import type { ContainerProps } from '@mantine/core';
import { Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { SiteBreadcrumbs } from '@/components/common/site-breadcrumbs';
import { SitePageFrame } from '@/components/common/site-page-frame';

interface SiteSubpageItem {
    label: string;
    href?: string;
}

interface SiteSubpageFrameProps {
    children: ReactNode;
    items: SiteSubpageItem[];
    title: string;
    description: string;
    pageSize?: ContainerProps['size'];
}

export function SiteSubpageFrame({ children, items, title, description, pageSize }: SiteSubpageFrameProps) {
    return (
        <SitePageFrame size={pageSize}>
            <Stack gap="xl">
                <header>
                    <SiteBreadcrumbs items={[{ label: 'トップページ', href: '/' }, ...items]} />
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
