export type TicketType = '片道乗車券' | '往復乗車券' | '連続乗車券' | '別線往復乗車券';

export interface Route {
    id: string;
    line: string;
    station: string;
}

export interface RouteState {
    type: TicketType;
    month: string;
    day: string;
    dateOption: 'use' | 'skip';
    departure: string;
    via: string;
    destination: string;
    routes: Route[];
    routes2: Route[];
    notes: string;
}

export interface SavedRouteState {
    id: string;
    createdAtTs: number;
    route: RouteState;
}
