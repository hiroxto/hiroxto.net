import {
    CROSS_STATION_TRANSFERS,
    SAME_STATION_OUTSIDE_TRANSFERS,
    STATION_NAMES,
    type StationId,
} from '@/lib/tokyometro-core/data';
import { z } from '@/lib/zod';

/** 同駅の乗換は駅IDで、異駅名の乗換は接続定義の始点駅のIDで選択する。 */
export const outsideTransferOptions = [
    ...[...new Set(SAME_STATION_OUTSIDE_TRANSFERS.map(([stationId]) => stationId))].map((stationId) => ({
        value: stationId,
        label: STATION_NAMES[stationId],
    })),
    ...CROSS_STATION_TRANSFERS.filter((connection) => connection.type === 'outside').map((connection) => ({
        value: connection.fromStationId,
        label: `${STATION_NAMES[connection.fromStationId]} / ${STATION_NAMES[connection.toStationId]}`,
    })),
];

export const allOutsideTransferIds: StationId[] = outsideTransferOptions.map((option) => option.value);

export const emptyOutsideTransfersMessage = '利用する改札外乗換駅を1つ以上選択してください';

export const outsideTransferIdSchema = z.enum(allOutsideTransferIds, {
    error: '指定された改札外乗換駅が見つかりません',
});
export const outsideTransferIdsSchema = z.array(outsideTransferIdSchema).min(1, emptyOutsideTransfersMessage);

export const isOutsideTransferId = (value: unknown): value is StationId =>
    outsideTransferIdSchema.safeParse(value).success;
