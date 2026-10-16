import { z } from 'zod';
import type { Route } from '@/lib/fare-ticket-route-planner/types';

interface RouteStationValidationInput {
    index: number;
    station: string;
    departure: string;
    destination: string;
    routes: readonly Route[];
}

/** 空欄と自分自身の行を除外し、発着駅、発駅、着駅、他の経路行の順に重複を検証する。 */
export const getRouteStationError = ({
    index,
    station,
    departure,
    destination,
    routes,
}: RouteStationValidationInput): string | null => {
    const stationSchema = z
        .string()
        .trim()
        .refine((value) => value === '' || value !== departure || value !== destination, '発着駅と重複')
        .refine((value) => value === '' || value !== departure, '発駅と重複')
        .refine((value) => value === '' || value !== destination, '着駅と重複')
        .refine(
            (value) =>
                value === '' ||
                !routes.some((route, routeIndex) => routeIndex !== index && route.station.trim() === value),
            '経路内重複',
        );
    const result = stationSchema.safeParse(station);
    return result.success ? null : result.error.issues[0].message;
};
