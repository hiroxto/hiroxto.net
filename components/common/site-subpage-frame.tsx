import { Stack } from '@mantine/core';
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
}

export function SiteSubpageFrame({ children, items }: SiteSubpageFrameProps) {
    return (
        <SitePageFrame>
            <Stack gap="xl">
                <header>
                    <SiteBreadcrumbs items={[{ label: 'トップページ', href: '/' }, ...items]} />
                </header>
                {children}
            </Stack>
        </SitePageFrame>
    );
}
