import { Breadcrumbs, Text } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';

interface SiteBreadcrumbItem {
    label: string;
    href?: string;
}

interface SiteBreadcrumbsProps {
    items: SiteBreadcrumbItem[];
}

export function SiteBreadcrumbs({ items }: SiteBreadcrumbsProps) {
    return (
        <Breadcrumbs
            separator="/"
            separatorMargin="sm"
            styles={{
                root: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    rowGap: '0.25rem',
                },
                breadcrumb: {
                    minWidth: 0,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                },
                separator: {
                    alignSelf: 'flex-start',
                },
            }}
        >
            {items.map((item) =>
                item.href == null ? (
                    <Text key={item.label} c="dimmed">
                        {item.label}
                    </Text>
                ) : (
                    <InternalLink key={item.href} href={item.href}>
                        {item.label}
                    </InternalLink>
                ),
            )}
        </Breadcrumbs>
    );
}
