export interface Route {
    id: string;
    line: string;
    station: string;
}

export interface RouteState {
    month: string;
    day: string;
    dateOption: 'use' | 'skip';
    departure: string;
    destination: string;
    routes: Route[];
    notes: string;
}

export interface SavedRouteState {
    id: string;
    createdAtTs: number;
    route: RouteState;
}
