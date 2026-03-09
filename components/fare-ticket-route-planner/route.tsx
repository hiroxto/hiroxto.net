'use client';

import { Autocomplete, CloseButton, Input } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { lineToStations, stationToLines } from '@/lib/fare-ticket-route-planner/route-complete';

export function RouteEditor() {
    const routes = useRouteStateStore((state) => state.routes);
    const addRoute = useRouteStateStore((state) => state.addRoute);
    const updateLine = useRouteStateStore((state) => state.updateLine);
    const updateStation = useRouteStateStore((state) => state.updateStation);
    const deleteRoute = useRouteStateStore((state) => state.deleteRoute);
    const departure = useRouteStateStore((state) => state.departure);
    const destination = useRouteStateStore((state) => state.destination);
    const useComplete = useInputSettingStore((state) => state.useComplete);

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && event.shiftKey) {
            addRoute(index);
        }

        if (event.key === 'Tab' && !event.shiftKey && index === routes.length - 1) {
            addRoute(-1);
        }
    };

    const getLineCompletes = (index: number) => {
        if (index === 0) {
            return stationToLines.get(departure) ?? Array.from(lineToStations.keys());
        }

        const lines = stationToLines.get(routes[index - 1]?.station ?? '') ?? [];
        const prevLine = routes[index - 1]?.line;

        return lines.filter((line) => line !== prevLine);
    };

    const getStationCompletes = (index: number) => {
        const stations = lineToStations.get(routes[index]?.line ?? '') ?? [];
        const excludeStation = index === 0 ? departure : (routes[index - 1]?.station ?? '');

        return stations.filter((station) => station !== excludeStation);
    };

    const getStationError = (index: number, station: string) => {
        const trimmedStation = station.trim();
        if (trimmedStation === '') {
            return null;
        }

        if (trimmedStation === departure && trimmedStation === destination) {
            return '発着駅と重複';
        }

        if (trimmedStation === departure) {
            return '発駅と重複';
        }

        if (trimmedStation === destination) {
            return '着駅と重複';
        }

        return routes.some((route, routeIndex) => routeIndex !== index && route.station.trim() === trimmedStation)
            ? '経路内重複'
            : null;
    };

    return (
        <>
            <h2 className={styles.sectionTitle}>経路</h2>
            {routes.map((route, index) => {
                const stationError = getStationError(index, route.station);

                return (
                    <div className="grid grid-cols-12" key={route.id}>
                        <div className="col-span-12 xl:col-span-1">
                            <p>経路{index + 1}</p>
                        </div>
                        <div className="col-span-12 xl:col-span-5">
                            {useComplete ? (
                                <Autocomplete
                                    label="路線"
                                    placeholder="路線"
                                    className="xl:w-3/4"
                                    value={route.line}
                                    data={getLineCompletes(index)}
                                    onChange={(value) => updateLine(index, value)}
                                    onKeyDown={(event) => handleKeyDown(index, event)}
                                />
                            ) : (
                                <Input.Wrapper label="路線" className="xl:w-3/4">
                                    <Input
                                        placeholder="路線"
                                        value={route.line}
                                        onChange={(event) => updateLine(index, event.target.value)}
                                        onKeyDown={(event) => handleKeyDown(index, event)}
                                    />
                                </Input.Wrapper>
                            )}
                        </div>
                        <div className="col-span-11 xl:col-span-5">
                            {useComplete ? (
                                <Autocomplete
                                    label="接続駅"
                                    placeholder="接続駅"
                                    className="xl:w-3/4"
                                    value={route.station}
                                    data={getStationCompletes(index)}
                                    error={stationError}
                                    onChange={(value) => {
                                        updateStation(index, value);
                                        if (value.trim() !== '' && index === routes.length - 1) {
                                            addRoute(-1);
                                        }
                                    }}
                                    onKeyDown={(event) => handleKeyDown(index, event)}
                                />
                            ) : (
                                <Input.Wrapper label="接続駅" className="xl:w-3/4" error={stationError}>
                                    <Input
                                        placeholder="接続駅"
                                        value={route.station}
                                        error={stationError != null}
                                        onChange={(event) => updateStation(index, event.target.value)}
                                        onKeyDown={(event) => handleKeyDown(index, event)}
                                    />
                                </Input.Wrapper>
                            )}
                        </div>
                        <div className="col-span-1 xl:col-span-1">
                            <CloseButton onClick={() => deleteRoute(index)} tabIndex={-1} />
                        </div>
                    </div>
                );
            })}
        </>
    );
}
