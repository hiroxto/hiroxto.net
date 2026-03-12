'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SectionTitle } from '@/components/fare-ticket-route-planner/section-title';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { format } from '@/lib/fare-ticket-route-planner/formatter';

export function Output() {
    const { type, month, day, dateOption, departure, destination, routes, notes } = useRouteStateStore(
        useShallow((state) => ({
            type: state.type,
            month: state.month,
            day: state.day,
            dateOption: state.dateOption,
            departure: state.departure,
            destination: state.destination,
            routes: state.routes,
            notes: state.notes,
        })),
    );

    const valuedRoutes = useMemo(() => routes.filter((route) => route.line.trim() !== ''), [routes]);
    const output = useMemo(() => {
        const header = [
            type,
            dateOption === 'use' ? `利用開始日: ${month}月${day}日` : null,
            `区間: ${departure}→${destination}`,
        ]
            .filter((element) => element != null)
            .join('\n\n');

        const routesOutput = format(valuedRoutes);
        const footer = notes === '' ? '' : `備考: ${notes.trim()}`;

        return `${header}\n\n${routesOutput}\n\n${footer}`.trim();
    }, [type, month, day, dateOption, departure, destination, valuedRoutes, notes]);

    return (
        <>
            <SectionTitle>出力</SectionTitle>

            <pre className={styles.output}>
                <span className="whitespace-pre-wrap">{output}</span>
            </pre>
        </>
    );
}
