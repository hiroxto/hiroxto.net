'use client';

import type { ReactNode } from 'react';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';

interface PageShellProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
    return (
        <div className={styles.app}>
            <div className={styles.container}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.description}>{description}</p>
                </div>

                {children}
            </div>
        </div>
    );
}
