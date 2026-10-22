import type { PlannerState } from '@/lib/tokyometro-transfer-route-planner/planner';

export const sakuradamonToAsakusaState: PlannerState = {
    fromStationId: 'sakuradamon',
    toStationId: 'asakusa',
    rows: [
        { lineId: 'yurakucho', stationId: 'yurakucho' },
        { lineId: 'hibiya', stationId: 'toranomon-hills' },
        { lineId: 'ginza', stationId: 'tameike-sanno' },
        { lineId: 'chiyoda', stationId: 'omote-sando' },
        { lineId: 'ginza', stationId: 'shibuya' },
        { lineId: 'fukutoshin', stationId: 'shinjuku-sanchome' },
        { lineId: 'marunouchi', stationId: 'akasaka-mitsuke' },
        { lineId: 'hanzomon', stationId: 'kudanshita' },
        { lineId: 'tozai', stationId: 'iidabashi' },
        { lineId: 'yurakucho', stationId: 'ikebukuro' },
        { lineId: 'marunouchi', stationId: 'awajicho' },
        { lineId: 'chiyoda', stationId: 'otemachi' },
        { lineId: 'marunouchi', stationId: 'ginza' },
        { lineId: 'yurakucho', stationId: 'shintomicho' },
        { lineId: 'hibiya', stationId: 'ningyocho' },
        { lineId: 'hanzomon', stationId: 'mitsukoshimae' },
        { lineId: 'ginza', stationId: 'ueno-hirokoji' },
        { lineId: 'hibiya', stationId: 'ueno' },
        { lineId: 'ginza', stationId: 'asakusa' },
    ],
};
