import type { ReactNode } from 'react';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';

export function SectionTitle({ children }: { children: ReactNode }) {
    return <h2 className={styles.sectionTitle}>{children}</h2>;
}
