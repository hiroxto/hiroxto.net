'use client';

import { Autocomplete, CloseButton, Input } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import type { Route } from '@/lib/fare-ticket-route-planner/types';

interface RouteRowProps {
    route: Route;
    index: number;
    useComplete: boolean;
    stationError: string | null;
    lineCompletes: string[];
    stationCompletes: string[];
    onAddRoute: (index: number) => void;
    onUpdateLine: (index: number, line: string) => void;
    onUpdateStation: (index: number, station: string) => void;
    onDeleteRoute: (index: number) => void;
    onHandleKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
    isLastRow: boolean;
}

export function RouteRow({
    route,
    index,
    useComplete,
    stationError,
    lineCompletes,
    stationCompletes,
    onAddRoute,
    onUpdateLine,
    onUpdateStation,
    onDeleteRoute,
    onHandleKeyDown,
    isLastRow,
}: RouteRowProps) {
    return (
        <div className="grid grid-cols-12">
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
                        data={lineCompletes}
                        onChange={(value) => onUpdateLine(index, value)}
                        onKeyDown={(event) => onHandleKeyDown(index, event)}
                    />
                ) : (
                    <Input.Wrapper label="路線" className="xl:w-3/4">
                        <Input
                            placeholder="路線"
                            value={route.line}
                            onChange={(event) => onUpdateLine(index, event.target.value)}
                            onKeyDown={(event) => onHandleKeyDown(index, event)}
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
                        data={stationCompletes}
                        error={stationError}
                        onChange={(value) => {
                            onUpdateStation(index, value);
                            if (value.trim() !== '' && isLastRow) {
                                onAddRoute(-1);
                            }
                        }}
                        onKeyDown={(event) => onHandleKeyDown(index, event)}
                    />
                ) : (
                    <Input.Wrapper label="接続駅" className="xl:w-3/4" error={stationError}>
                        <Input
                            placeholder="接続駅"
                            value={route.station}
                            error={stationError != null}
                            onChange={(event) => onUpdateStation(index, event.target.value)}
                            onKeyDown={(event) => onHandleKeyDown(index, event)}
                        />
                    </Input.Wrapper>
                )}
            </div>
            <div className="col-span-1 xl:col-span-1">
                <CloseButton onClick={() => onDeleteRoute(index)} tabIndex={-1} />
            </div>
        </div>
    );
}
