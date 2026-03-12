'use client';

import { Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { InternalLink } from '@/components/common/internal-link';
import styles from '@/components/swarm-checkin-regulation-checker/swarm-checkin-regulation-checker.module.css';

interface PageShellProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
    return (
        <div className={styles.app}>
            <div className={styles.container}>
                <header>
                    <Group gap="sm">
                        <InternalLink href="/">トップページ</InternalLink>
                        <Text c="dimmed">/</Text>
                        <InternalLink href="/tools">ツール一覧</InternalLink>
                        <Text c="dimmed">/</Text>
                        <Text>Swarm コイン規制チェッカー</Text>
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
