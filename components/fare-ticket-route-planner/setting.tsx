'use client';

import { Input, Select } from '@mantine/core';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import type { TicketType } from '@/lib/fare-ticket-route-planner/types';
import { isTicketType } from '@/lib/fare-ticket-route-planner/utils';

export function Setting() {
    const type = useRouteStateStore((state) => state.type);
    const month = useRouteStateStore((state) => state.month);
    const day = useRouteStateStore((state) => state.day);
    const dateOption = useRouteStateStore((state) => state.dateOption);
    const departure = useRouteStateStore((state) => state.departure);
    const destination = useRouteStateStore((state) => state.destination);
    const setType = useRouteStateStore((state) => state.setType);
    const setMonth = useRouteStateStore((state) => state.setMonth);
    const setDay = useRouteStateStore((state) => state.setDay);
    const setDeparture = useRouteStateStore((state) => state.setDeparture);
    const setDestination = useRouteStateStore((state) => state.setDestination);
    const ticketTypes: TicketType[] = ['片道乗車券', '往復乗車券', '連続乗車券', '別線往復乗車券'];

    return (
        <>
            <h2 className={styles.sectionTitle}>設定</h2>

            <div className="grid grid-cols-12">
                <div className="col-span-12 xl:col-span-3">
                    <Select
                        label="券種"
                        placeholder="券種"
                        className="xl:w-3/4"
                        data={ticketTypes}
                        value={type}
                        onChange={(value) => {
                            if (value == null || !isTicketType(value)) {
                                return;
                            }

                            setType(value);
                        }}
                    />
                </div>
                <div className="col-span-12 xl:col-span-3">
                    <div className="grid grid-cols-2 xl:w-3/4">
                        <div className="col-span-1">
                            <Input.Wrapper label="利用開始月">
                                <Input
                                    placeholder="月"
                                    value={month}
                                    onChange={(event) => setMonth(event.target.value)}
                                    disabled={dateOption !== 'use'}
                                />
                            </Input.Wrapper>
                        </div>
                        <div className="col-span-1">
                            <Input.Wrapper label="利用開始日">
                                <Input
                                    placeholder="日"
                                    value={day}
                                    onChange={(event) => setDay(event.target.value)}
                                    disabled={dateOption !== 'use'}
                                />
                            </Input.Wrapper>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 xl:col-span-3">
                    <Input.Wrapper label="発駅" className="xl:w-3/4">
                        <Input
                            placeholder="発駅"
                            value={departure}
                            onChange={(event) => setDeparture(event.target.value)}
                        />
                    </Input.Wrapper>
                </div>
                <div className="col-span-12 xl:col-span-3">
                    <Input.Wrapper label="着駅" className="xl:w-3/4">
                        <Input
                            placeholder="着駅"
                            value={destination}
                            onChange={(event) => setDestination(event.target.value)}
                        />
                    </Input.Wrapper>
                </div>
            </div>
        </>
    );
}
