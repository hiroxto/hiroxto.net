'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { fareTicketRoutePlannerStorage } from '@/components/fare-ticket-route-planner/stores/persist-storage';
import type { Route, RouteState, TicketType } from '@/lib/fare-ticket-route-planner/types';

interface RouteStateActions {
    setType: (type: TicketType) => void;
    resetType: () => void;
    setDeparture: (departure: string) => void;
    setDestination: (destination: string) => void;
    setMonth: (month: string) => void;
    setDay: (day: string) => void;
    setDateWithIndex: (addDate: number) => void;
    useDate: () => void;
    skipDate: () => void;
    addRoute: (index: number) => void;
    updateLine: (index: number, line: string) => void;
    updateStation: (index: number, station: string) => void;
    deleteRoute: (index: number) => void;
    deleteEmptyRoutes: () => void;
    deleteAllRoutes: () => void;
    reverse: () => void;
    resetStations: () => void;
    setNotes: (notes: string) => void;
    resetNotes: () => void;
    reconstruct: (state: Partial<RouteState>) => void;
}

export const createRoute = (): Route => ({ id: crypto.randomUUID(), line: '', station: '' });

export const useRouteStateStore = create<RouteState & RouteStateActions>()(
    devtools(
        persist(
            (set) => ({
                type: '片道乗車券',
                month: '',
                day: '',
                dateOption: 'use',
                departure: '',
                via: '',
                destination: '',
                routes: [createRoute()],
                routes2: [],
                notes: '',

                setType(type) {
                    set({ type });
                },
                resetType() {
                    set({ type: '片道乗車券' });
                },
                setDeparture(departure) {
                    set({ departure });
                },
                setDestination(destination) {
                    set({ destination });
                },
                setMonth(month) {
                    set({ month });
                },
                setDay(day) {
                    set({ day });
                },
                setDateWithIndex(addDate) {
                    const today = new Date();
                    today.setDate(today.getDate() + addDate);
                    set({
                        dateOption: 'use',
                        month: (today.getMonth() + 1).toString(),
                        day: today.getDate().toString(),
                    });
                },
                useDate() {
                    set({ dateOption: 'use' });
                },
                skipDate() {
                    set({ dateOption: 'skip', month: '', day: '' });
                },
                addRoute(index) {
                    if (index <= -1) {
                        set((state) => ({
                            routes: [...state.routes, createRoute()],
                        }));
                        return;
                    }

                    set((state) => {
                        const routes = [...state.routes];
                        routes.splice(index + 1, 0, createRoute());

                        return { routes };
                    });
                },
                updateLine(index, line) {
                    set((state) => {
                        const routes = [...state.routes];
                        const route = routes[index];

                        if (route == null) {
                            return { routes };
                        }

                        routes[index] = { ...route, line };
                        return { routes };
                    });
                },
                updateStation(index, station) {
                    set((state) => {
                        const routes = [...state.routes];
                        const route = routes[index];

                        if (route == null) {
                            return { routes };
                        }

                        routes[index] = { ...route, station };
                        return { routes };
                    });
                },
                deleteRoute(index) {
                    set((state) => {
                        const routes = [...state.routes];
                        routes.splice(index, 1);
                        return { routes };
                    });
                },
                deleteEmptyRoutes() {
                    set((state) => {
                        const valuedRoutes = state.routes.filter(
                            (route) => route.line.trim() !== '' || route.station.trim() !== '',
                        );

                        return {
                            routes: valuedRoutes.length === 0 ? [createRoute()] : valuedRoutes,
                        };
                    });
                },
                deleteAllRoutes() {
                    set({ routes: [createRoute()] });
                },
                reverse() {
                    set((state) => {
                        const routes = state.routes.filter(
                            (route) => route.line.trim() !== '' || route.station.trim() !== '',
                        );
                        const reversedRoutes = routes.reverse().map((route, index, originalRoutes) => ({
                            ...route,
                            station: originalRoutes[index + 1] == null ? '' : originalRoutes[index + 1].station,
                        }));

                        return {
                            departure: state.destination,
                            destination: state.departure,
                            routes: reversedRoutes.length === 0 ? [createRoute()] : reversedRoutes,
                        };
                    });
                },
                resetStations() {
                    set({ departure: '', via: '', destination: '' });
                },
                setNotes(notes) {
                    set({ notes });
                },
                resetNotes() {
                    set({ notes: '' });
                },
                reconstruct(state) {
                    set(state);
                },
            }),
            {
                name: 'route-state',
                storage: fareTicketRoutePlannerStorage,
            },
        ),
    ),
);
