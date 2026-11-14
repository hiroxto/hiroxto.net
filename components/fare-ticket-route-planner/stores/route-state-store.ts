'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { fareTicketRoutePlannerStorage } from '@/components/fare-ticket-route-planner/stores/persist-storage';
import { type EditHistory, recordEdit, redoEdit, undoEdit } from '@/lib/edit-history/history';
import type { Route, RouteState } from '@/lib/fare-ticket-route-planner/types';

interface RouteStateActions {
    undo: () => void;
    redo: () => void;
    finishEditing: () => void;
    setCalendarDate: (month: string, day: string) => void;
    clearSetting: () => void;
    setDeparture: (departure: string) => void;
    setDestination: (destination: string) => void;
    setMonth: (month: string) => void;
    setDay: (day: string) => void;
    setDateWithIndex: (addDate: number) => void;
    useDate: () => void;
    skipDate: () => void;
    addRoute: (index: number) => void;
    updateLine: (index: number, line: string) => void;
    updateStation: (index: number, station: string, appendIfLast?: boolean) => void;
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

const emptyRoutes = (routes: Route[]): Route[] => {
    const first = routes[0];
    return first?.line === '' && first.station === '' ? [first] : [createRoute()];
};

interface RouteHistoryState {
    past: RouteState[];
    future: RouteState[];
    editGroup: string | null;
}

const snapshot = (state: RouteState): RouteState => ({
    month: state.month,
    day: state.day,
    dateOption: state.dateOption,
    departure: state.departure,
    destination: state.destination,
    routes: state.routes,
    notes: state.notes,
});

// 発着・日付・備考・全経路を一緒に復元する。入力欄のblurと別操作で連続入力を区切る。
// 現在の入力だけを永続化し、読み込み直したときに履歴は空にする。
export const useRouteStateStore = create<RouteState & RouteStateActions & RouteHistoryState>()(
    devtools(
        persist(
            (set, get) => {
                const history = (): EditHistory<RouteState> => {
                    const state = get();
                    return { past: state.past, present: snapshot(state), future: state.future, group: state.editGroup };
                };
                const restore = (next: EditHistory<RouteState>) =>
                    set({
                        ...next.present,
                        past: next.past,
                        future: next.future,
                        editGroup: next.group,
                    });
                const edit = (
                    update: Partial<RouteState> | ((state: RouteState) => Partial<RouteState>),
                    group: string | null = null,
                ) => {
                    const previous = history();
                    const next = {
                        ...previous.present,
                        ...(typeof update === 'function' ? update(previous.present) : update),
                    };
                    const result = recordEdit(previous, next, group);
                    if (result !== previous) restore(result);
                    else if (group == null) set({ editGroup: null });
                };
                return {
                    past: [],
                    future: [],
                    editGroup: null,
                    undo() {
                        restore(undoEdit(history()));
                    },
                    redo() {
                        restore(redoEdit(history()));
                    },
                    finishEditing() {
                        set({ editGroup: null });
                    },
                    setCalendarDate(month, day) {
                        edit({ month, day });
                    },
                    clearSetting() {
                        edit({ dateOption: 'use', departure: '', destination: '' });
                    },
                    month: '',
                    day: '',
                    dateOption: 'use',
                    departure: '',
                    destination: '',
                    routes: [createRoute()],
                    notes: '',

                    setDeparture(departure) {
                        edit({ departure }, 'departure');
                    },
                    setDestination(destination) {
                        edit({ destination }, 'destination');
                    },
                    setMonth(month) {
                        edit({ month }, 'month');
                    },
                    setDay(day) {
                        edit({ day }, 'day');
                    },
                    setDateWithIndex(addDate) {
                        const today = new Date();
                        today.setDate(today.getDate() + addDate);
                        edit({
                            dateOption: 'use',
                            month: (today.getMonth() + 1).toString(),
                            day: today.getDate().toString(),
                        });
                    },
                    useDate() {
                        edit({ dateOption: 'use' });
                    },
                    skipDate() {
                        edit({ dateOption: 'skip', month: '', day: '' });
                    },
                    addRoute(index) {
                        if (index <= -1) {
                            edit((state) => ({
                                routes: [...state.routes, createRoute()],
                            }));
                            return;
                        }

                        edit((state) => {
                            const routes = [...state.routes];
                            routes.splice(index + 1, 0, createRoute());

                            return { routes };
                        });
                    },
                    updateLine(index, line) {
                        edit((state) => {
                            const routes = [...state.routes];
                            const route = routes[index];

                            if (route == null) {
                                return { routes };
                            }

                            routes[index] = { ...route, line };
                            return { routes };
                        }, `line:${get().routes[index]?.id}`);
                    },
                    updateStation(index, station, appendIfLast = false) {
                        edit((state) => {
                            const routes = [...state.routes];
                            const route = routes[index];

                            if (route == null) {
                                return { routes };
                            }

                            routes[index] = { ...route, station };
                            if (appendIfLast && index === routes.length - 1 && station.trim() !== '')
                                routes.push(createRoute());
                            return { routes };
                        }, `station:${get().routes[index]?.id}`);
                    },
                    deleteRoute(index) {
                        edit((state) => {
                            const routes = [...state.routes];
                            routes.splice(index, 1);
                            return { routes };
                        });
                    },
                    deleteEmptyRoutes() {
                        edit((state) => {
                            const valuedRoutes = state.routes.filter(
                                (route) => route.line.trim() !== '' || route.station.trim() !== '',
                            );

                            return {
                                routes: valuedRoutes.length === 0 ? emptyRoutes(state.routes) : valuedRoutes,
                            };
                        });
                    },
                    deleteAllRoutes() {
                        edit((state) => ({ routes: emptyRoutes(state.routes) }));
                    },
                    reverse() {
                        edit((state) => {
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
                                routes: reversedRoutes.length === 0 ? emptyRoutes(state.routes) : reversedRoutes,
                            };
                        });
                    },
                    resetStations() {
                        edit({ departure: '', destination: '' });
                    },
                    setNotes(notes) {
                        edit({ notes }, 'notes');
                    },
                    resetNotes() {
                        edit({ notes: '' });
                    },
                    reconstruct(state) {
                        edit(state);
                    },
                };
            },
            {
                name: 'route-state',
                storage: fareTicketRoutePlannerStorage,
                partialize: (state: RouteState & RouteStateActions & RouteHistoryState) => snapshot(state),
                merge: (persisted, current) => ({
                    ...current,
                    ...snapshot({ ...current, ...(persisted as Partial<RouteState>) }),
                    past: [],
                    future: [],
                    editGroup: null,
                }),
            },
        ),
    ),
);
