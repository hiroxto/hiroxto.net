'use client';

import { ControlButtons } from '@/components/fare-ticket-route-planner/control-buttons';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { Note } from '@/components/fare-ticket-route-planner/note';
import { Output } from '@/components/fare-ticket-route-planner/output';
import { RouteEditor } from '@/components/fare-ticket-route-planner/route';
import { Setting } from '@/components/fare-ticket-route-planner/setting';

export function FareTicketRoutePlannerPage() {
    return (
        <div className={styles.app}>
            <div className={styles.container}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>乗車券の経路作成</h1>
                    <p className={styles.description}>複雑な経路の乗車券作る際の補助ツール</p>
                </div>

                <div className="grid grid-cols-12 xl:gap-4">
                    <div className="col-span-12 xl:col-span-8">
                        <Setting />
                        <RouteEditor />
                        <Note />
                        <Output />
                    </div>
                    <div className="col-span-12 xl:col-span-4">
                        <ControlButtons />
                    </div>
                </div>
            </div>
        </div>
    );
}
