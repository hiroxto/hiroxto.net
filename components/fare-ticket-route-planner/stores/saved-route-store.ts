'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { fareTicketRoutePlannerStorage } from '@/components/fare-ticket-route-planner/stores/persist-storage';
import type { RouteState, SavedRouteState } from '@/lib/fare-ticket-route-planner/types';

interface SavedRoutesStoreState {
    routes: SavedRouteState[];
}

interface SavedRoutesStoreActions {
    saveRoute: (route: RouteState) => void;
    updateRoute: (id: string, route: Partial<RouteState>) => void;
    deleteRoute: (id: string) => void;
    bulkDeleteRoute: (ids: string[]) => void;
}

export const useSavedRouteStore = create<SavedRoutesStoreState & SavedRoutesStoreActions>()(
    devtools(
        persist(
            (set) => ({
                routes: [],
                saveRoute: (route) => {
                    set((state) => ({
                        routes: [
                            ...state.routes,
                            {
                                id: crypto.randomUUID(),
                                createdAtTs: Date.now(),
                                route,
                            },
                        ],
                    }));
                },
                updateRoute: (id, route) => {
                    set((state) => ({
                        routes: state.routes.map((savedRoute) =>
                            savedRoute.id === id
                                ? {
                                      ...savedRoute,
                                      route: { ...savedRoute.route, ...route },
                                  }
                                : savedRoute,
                        ),
                    }));
                },
                deleteRoute: (id) => {
                    set((state) => ({
                        routes: state.routes.filter((route) => route.id !== id),
                    }));
                },
                bulkDeleteRoute: (ids) => {
                    set((state) => ({
                        routes: state.routes.filter((route) => !ids.includes(route.id)),
                    }));
                },
            }),
            { name: 'saved-routes', storage: fareTicketRoutePlannerStorage },
        ),
    ),
);
