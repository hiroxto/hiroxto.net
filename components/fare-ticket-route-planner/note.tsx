'use client';

import { Textarea } from '@mantine/core';
import { useShallow } from 'zustand/react/shallow';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SectionTitle } from '@/components/fare-ticket-route-planner/section-title';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';

export function Note() {
    const { notes, setNotes } = useRouteStateStore(
        useShallow((state) => ({
            notes: state.notes,
            setNotes: state.setNotes,
        })),
    );

    return (
        <>
            <SectionTitle>備考</SectionTitle>
            <Textarea
                placeholder="備考"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={styles.note}
            />
        </>
    );
}
