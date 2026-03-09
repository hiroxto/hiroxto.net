'use client';

import { useMemo } from 'react';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { format } from '@/lib/fare-ticket-route-planner/formatter';

export function Output() {
    const type = useRouteStateStore((state) => state.type);
    const month = useRouteStateStore((state) => state.month);
    const day = useRouteStateStore((state) => state.day);
    const dateOption = useRouteStateStore((state) => state.dateOption);
    const departure = useRouteStateStore((state) => state.departure);
    const destination = useRouteStateStore((state) => state.destination);
    const routes = useRouteStateStore((state) => state.routes);
    const notes = useRouteStateStore((state) => state.notes);

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
            <h2 className={styles.sectionTitle}>出力</h2>

            <pre className={styles.output}>
                <span className="whitespace-pre-wrap">{output}</span>
            </pre>
        </>
    );
}
