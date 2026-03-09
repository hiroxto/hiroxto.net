'use client';

import { Textarea } from '@mantine/core';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';

export function Note() {
    const notes = useRouteStateStore((state) => state.notes);
    const setNotes = useRouteStateStore((state) => state.setNotes);

    return (
        <>
            <h2 className={styles.sectionTitle}>備考</h2>
            <Textarea
                placeholder="備考"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={styles.note}
            />
        </>
    );
}
