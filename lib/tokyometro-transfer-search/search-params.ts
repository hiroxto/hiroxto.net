import { z } from 'zod';
import type { StationId } from './data';
import { isStationId, isValidMaximumOutsideTransferCount, MAX_OUTSIDE_TRANSFER_COUNT } from './search';

export type TokyoMetroTransferSearchParams = Record<string, string | string[] | undefined>;

export interface TokyoMetroTransferSearchQuery {
    fromStationId: StationId | null;
    toStationId: StationId | null;
    maximumOutsideTransferCount: number | null;
    error: string | null;
}

const stationNotFoundMessage = '指定された駅が見つかりません';
const sameStationMessage = '乗車駅と降車駅には異なる駅を指定してください';
const invalidMaximumOutsideTransferCountMessage = `最大改札外乗換回数は1〜${MAX_OUTSIDE_TRANSFER_COUNT}回で指定してください`;

const searchParamSchema = z.union([z.string(), z.array(z.string())]).optional();

const stationIdSchema = z.custom<StationId>(
    (value) => typeof value === 'string' && isStationId(value),
    stationNotFoundMessage,
);

const maximumOutsideTransferCountSchema = z.custom<number>(
    (value) => typeof value === 'number' && isValidMaximumOutsideTransferCount(value),
    invalidMaximumOutsideTransferCountMessage,
);

const tokyoMetroTransferSearchParamsSchema = z
    .object({
        from: searchParamSchema,
        to: searchParamSchema,
        maxOutsideTransfers: searchParamSchema,
    })
    .transform(({ from, to, maxOutsideTransfers }) => {
        const fromValue = typeof from === 'string' ? from : null;
        const toValue = typeof to === 'string' ? to : null;
        const maximumOutsideTransferCountValue = typeof maxOutsideTransfers === 'string' ? maxOutsideTransfers : null;
        const hasCompleteStationPair = fromValue != null && toValue != null;

        return {
            maximumOutsideTransferCount:
                maximumOutsideTransferCountValue == null ? null : Number(maximumOutsideTransferCountValue),
            fromStationId: hasCompleteStationPair ? fromValue : null,
            toStationId: hasCompleteStationPair ? toValue : null,
        };
    })
    .pipe(
        z
            .object({
                maximumOutsideTransferCount: maximumOutsideTransferCountSchema.nullable(),
                fromStationId: stationIdSchema.nullable(),
                toStationId: stationIdSchema.nullable(),
            })
            .refine(
                ({ fromStationId, toStationId }) => fromStationId == null || fromStationId !== toStationId,
                sameStationMessage,
            ),
    );

const emptyQuery: TokyoMetroTransferSearchQuery = {
    fromStationId: null,
    toStationId: null,
    maximumOutsideTransferCount: null,
    error: null,
};

export const parseTokyoMetroTransferSearchParams = (
    params: TokyoMetroTransferSearchParams,
): TokyoMetroTransferSearchQuery => {
    const parseResult = tokyoMetroTransferSearchParamsSchema.safeParse(params);

    if (!parseResult.success) {
        return {
            ...emptyQuery,
            error: parseResult.error.issues[0]?.message ?? '検索条件の入力に失敗しました',
        };
    }

    return {
        ...parseResult.data,
        error: null,
    };
};
