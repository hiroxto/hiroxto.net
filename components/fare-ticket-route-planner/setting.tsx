'use client';

import { Input } from '@mantine/core';
import { useShallow } from 'zustand/react/shallow';
import { SectionTitle } from '@/components/fare-ticket-route-planner/section-title';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';

export function Setting() {
    const { month, day, dateOption, departure, destination, setMonth, setDay, setDeparture, setDestination } =
        useRouteStateStore(
            useShallow((state) => ({
                month: state.month,
                day: state.day,
                dateOption: state.dateOption,
                departure: state.departure,
                destination: state.destination,
                setMonth: state.setMonth,
                setDay: state.setDay,
                setDeparture: state.setDeparture,
                setDestination: state.setDestination,
            })),
        );

    return (
        <>
            <SectionTitle>設定</SectionTitle>

            <div className="grid grid-cols-12">
                <div className="col-span-12 xl:col-span-3">
                    <div className="grid grid-cols-2 xl:w-3/4">
                        <div className="col-span-1">
                            <Input.Wrapper labelProps={{ fw: 500 }} label="利用開始月">
                                <Input
                                    radius="sm"
                                    placeholder="月"
                                    value={month}
                                    onChange={(event) => setMonth(event.target.value)}
                                    disabled={dateOption !== 'use'}
                                />
                            </Input.Wrapper>
                        </div>
                        <div className="col-span-1">
                            <Input.Wrapper labelProps={{ fw: 500 }} label="利用開始日">
                                <Input
                                    radius="sm"
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
                    <Input.Wrapper labelProps={{ fw: 500 }} label="発駅" className="xl:w-3/4">
                        <Input
                            radius="sm"
                            placeholder="発駅"
                            value={departure}
                            onChange={(event) => setDeparture(event.target.value)}
                        />
                    </Input.Wrapper>
                </div>
                <div className="col-span-12 xl:col-span-3">
                    <Input.Wrapper labelProps={{ fw: 500 }} label="着駅" className="xl:w-3/4">
                        <Input
                            radius="sm"
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
