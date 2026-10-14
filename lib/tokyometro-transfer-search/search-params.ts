import { z } from 'zod';
import type { StationId } from './data';
import { allOutsideTransferIds, emptyOutsideTransfersMessage, isOutsideTransferId } from './outside-transfers';
import {
    isStationId,
    isValidMaximumOutsideTransferCount,
    MAX_OUTSIDE_TRANSFER_COUNT,
    SEARCH_DURATION_LIMIT_MS,
} from './search';

export type TokyoMetroTransferSearchParams = Record<string, string | string[] | undefined>;

export interface TokyoMetroTransferSearchQuery {
    fromStationId: StationId | null;
    toStationId: StationId | null;
    maximumOutsideTransferCount: number | null;
    includeInsideTransfers: boolean;
    outsideTransferIds: StationId[];
    durationLimitMs: number;
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
        durationLimitMs: z.string({ error: '探索時間は正の整数で指定してください' }).optional(),
        from: searchParamSchema,
        to: searchParamSchema,
        maxOutsideTransfers: searchParamSchema,
        includeInsideTransfers: searchParamSchema,
        outsideTransfers: z.string({ error: '改札外乗換駅の指定は1つの文字列にしてください' }).optional(),
    })
    .transform(({ from, to, maxOutsideTransfers, includeInsideTransfers, outsideTransfers, durationLimitMs }) => {
        const fromValue = typeof from === 'string' ? from : null;
        const toValue = typeof to === 'string' ? to : null;
        const maximumOutsideTransferCountValue = typeof maxOutsideTransfers === 'string' ? maxOutsideTransfers : null;
        const hasCompleteStationPair = fromValue != null && toValue != null;
        let outsideTransferIds: string[] = allOutsideTransferIds;

        if (outsideTransfers !== undefined) {
            outsideTransferIds = outsideTransfers === '' ? [] : [...new Set(outsideTransfers.split(','))];
        }

        return {
            durationLimitMs: durationLimitMs === undefined ? SEARCH_DURATION_LIMIT_MS : Number(durationLimitMs),
            outsideTransferIds,
            includeInsideTransfers: typeof includeInsideTransfers === 'string' ? includeInsideTransfers : 'true',
            maximumOutsideTransferCount:
                maximumOutsideTransferCountValue == null ? null : Number(maximumOutsideTransferCountValue),
            fromStationId: hasCompleteStationPair ? fromValue : null,
            toStationId: hasCompleteStationPair ? toValue : null,
        };
    })
    .pipe(
        z
            .object({
                durationLimitMs: z
                    .number({ error: '探索時間は正の整数で指定してください' })
                    .int('探索時間は正の整数で指定してください')
                    .positive('探索時間は正の整数で指定してください'),
                outsideTransferIds: z
                    .array(z.custom<StationId>(isOutsideTransferId, '指定された改札外乗換駅が見つかりません'))
                    .min(1, emptyOutsideTransfersMessage),
                maximumOutsideTransferCount: maximumOutsideTransferCountSchema.nullable(),
                includeInsideTransfers: z
                    .enum(['true', 'false'], { error: '改札内乗換の指定はtrueまたはfalseにしてください' })
                    .transform((value) => value === 'true'),
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
    includeInsideTransfers: true,
    outsideTransferIds: allOutsideTransferIds,
    durationLimitMs: SEARCH_DURATION_LIMIT_MS,
    error: null,
};

/**
 * 検索ボタン押下時にURLへ保存した条件を復元する。
 * durationLimitMsはミリ秒単位の正の整数。未指定は5000、空・不正な値・複数指定はエラーとする。
 * 既定値のURLではdurationLimitMsを省略する。
 * outsideTransfersは乗換IDのカンマ区切り。未指定は全て利用し、空・不正なID・複数指定はエラーとする。
 * 同じIDの重複は除去する。全地点選択時のURLではoutsideTransfersを省略する。
 * includeInsideTransfersはtrue/falseで指定し、未指定・複数指定では既定のONとして扱う。
 * OFFでは改札内乗換を探索対象から除外し、ONのURLではこのパラメータを省略する。
 */
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
