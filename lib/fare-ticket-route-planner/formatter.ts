import type { Route } from '@/lib/fare-ticket-route-planner/types';

export const format = (routes: Route[]): string => {
    if (routes.length === 0) {
        return '';
    }

    const exceptLastRoutes = routes.slice(0, routes.length - 1);
    const lastRoute = routes.at(-1);

    if (lastRoute == null) {
        return '';
    }

    const output = `${exceptLastRoutes.map((route) => `${route.line}\n     ${route.station}\n`).join('')}${lastRoute.line}`;

    return output.trim();
};
