'use client';

import type { KeyboardEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { RouteRow } from '@/components/fare-ticket-route-planner/route-row';
import { SectionTitle } from '@/components/fare-ticket-route-planner/section-title';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { lineToStations, stationToLines } from '@/lib/fare-ticket-route-planner/route-complete';

export function RouteEditor() {
    const { routes, addRoute, updateLine, updateStation, deleteRoute, departure, destination } = useRouteStateStore(
        useShallow((state) => ({
            routes: state.routes,
            addRoute: state.addRoute,
            updateLine: state.updateLine,
            updateStation: state.updateStation,
            deleteRoute: state.deleteRoute,
            departure: state.departure,
            destination: state.destination,
        })),
    );
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
            <SectionTitle>経路</SectionTitle>
            {routes.map((route, index) => {
                const stationError = getStationError(index, route.station);

                return (
                    <RouteRow
                        key={route.id}
                        route={route}
                        index={index}
                        useComplete={useComplete}
                        stationError={stationError}
                        lineCompletes={getLineCompletes(index)}
                        stationCompletes={getStationCompletes(index)}
                        onAddRoute={addRoute}
                        onUpdateLine={updateLine}
                        onUpdateStation={updateStation}
                        onDeleteRoute={deleteRoute}
                        onHandleKeyDown={handleKeyDown}
                        isLastRow={index === routes.length - 1}
                    />
                );
            })}
        </>
    );
}
