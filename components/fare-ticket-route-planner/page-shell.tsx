'use client';

import { Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { InternalLink } from '@/components/common/internal-link';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';

interface BreadcrumbItem {
    href: string;
    label: string;
}

interface PageShellProps {
    title: string;
    description: string;
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export function PageShell({ title, description, children, breadcrumbs = [] }: PageShellProps) {
    return (
        <div className={styles.app}>
            <div className={styles.container}>
                <header>
                    <Group gap="sm">
                        <InternalLink href="/">トップページ</InternalLink>
                        <Text c="dimmed">/</Text>
                        <InternalLink href="/tools">ツール一覧</InternalLink>
                        {breadcrumbs.map((breadcrumb) => (
                            <div key={breadcrumb.href} className="contents">
                                <Text c="dimmed">/</Text>
                                <InternalLink href={breadcrumb.href}>{breadcrumb.label}</InternalLink>
                            </div>
                        ))}
                    </Group>
                </header>

                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.description}>{description}</p>
                </div>

                {children}
            </div>
        </div>
    );
}
