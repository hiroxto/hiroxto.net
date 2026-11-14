import type { StationId } from '@/lib/tokyometro-core/data';
import { isSameStation, stationIdSchema } from '@/lib/tokyometro-core/stations';
import { z } from '@/lib/zod';
import { allOutsideTransferIds, outsideTransferIdsSchema } from './outside-transfers';
import { SEARCH_DURATION_LIMIT_MS } from './search';
import {
    maximumOutsideTransferCountSchema,
    outsideTransferConditionsSchema,
    searchFormDurationSchema,
} from './validation';

export type TokyoMetroTransferSearchParams = Record<string, string | string[] | undefined>;

export interface TokyoMetroTransferSearchQuery {
    fromStationId: StationId | null;
    toStationId: StationId | null;
    maximumOutsideTransferCount: number | null;
    includeInsideTransfers: boolean;
    outsideTransferIds: StationId[];
    requiredOutsideTransferIds: StationId[];
    durationLimitMs: number;
    error: string | null;
}

const sameStationMessage = '乗車駅と降車駅には異なる駅を指定してください';
const searchParamSchema = z.union([z.string(), z.array(z.string())]).optional();

const tokyoMetroTransferSearchParamsSchema = z
    .object({
        durationLimitMs: z.string({ error: '探索時間は正の整数で指定してください' }).optional(),
        from: searchParamSchema,
        to: searchParamSchema,
        maxOutsideTransfers: searchParamSchema,
        includeInsideTransfers: searchParamSchema,
        requiredOutsideTransfers: z.string({ error: '必須の改札外乗換駅の指定は1つの文字列にしてください' }).optional(),
        outsideTransfers: z.string({ error: '改札外乗換駅の指定は1つの文字列にしてください' }).optional(),
    })
    .transform(
        ({
            from,
            to,
            maxOutsideTransfers,
            includeInsideTransfers,
            outsideTransfers,
            requiredOutsideTransfers,
            durationLimitMs,
        }) => {
            const fromValue = typeof from === 'string' ? from : null;
            const toValue = typeof to === 'string' ? to : null;
            const maximumOutsideTransferCountValue =
                typeof maxOutsideTransfers === 'string' ? maxOutsideTransfers : null;
            const hasCompleteStationPair = fromValue != null && toValue != null;
            let outsideTransferIds: string[] = allOutsideTransferIds;

            if (outsideTransfers !== undefined) {
                outsideTransferIds = outsideTransfers === '' ? [] : [...new Set(outsideTransfers.split(','))];
            }

            return {
                durationLimitMs: durationLimitMs === undefined ? SEARCH_DURATION_LIMIT_MS : Number(durationLimitMs),
                outsideTransferIds,
                requiredOutsideTransferIds: requiredOutsideTransfers
                    ? [...new Set(requiredOutsideTransfers.split(','))]
                    : [],
                includeInsideTransfers: typeof includeInsideTransfers === 'string' ? includeInsideTransfers : 'true',
                maximumOutsideTransferCount:
                    maximumOutsideTransferCountValue == null ? null : Number(maximumOutsideTransferCountValue),
                fromStationId: hasCompleteStationPair ? fromValue : null,
                toStationId: hasCompleteStationPair ? toValue : null,
            };
        },
    )
    .pipe(
        z
            .object({
                durationLimitMs: searchFormDurationSchema,
                outsideTransferIds: outsideTransferIdsSchema,
                requiredOutsideTransferIds: outsideTransferConditionsSchema.shape.requiredOutsideTransferIds.unwrap(),
                maximumOutsideTransferCount: maximumOutsideTransferCountSchema.nullable(),
                includeInsideTransfers: z
                    .enum(['true', 'false'], { error: '改札内乗換の指定はtrueまたはfalseにしてください' })
                    .transform((value) => value === 'true'),
                fromStationId: stationIdSchema.nullable(),
                toStationId: stationIdSchema.nullable(),
            })
            .refine(
                ({ fromStationId, toStationId }) => fromStationId == null || !isSameStation(fromStationId, toStationId),
                sameStationMessage,
            )
            .and(outsideTransferConditionsSchema),
    );

const emptyQuery: TokyoMetroTransferSearchQuery = {
    fromStationId: null,
    toStationId: null,
    maximumOutsideTransferCount: null,
    includeInsideTransfers: true,
    outsideTransferIds: allOutsideTransferIds,
    requiredOutsideTransferIds: [],
    durationLimitMs: SEARCH_DURATION_LIMIT_MS,
    error: null,
};

/**
 * 検索ボタンを押したときにURLに保存した検索条件を復元する。
 * 発着駅のIDが同じ場合や、発着駅が異駅名乗換の両端に当たる場合は、同一駅として検証エラーにする。
 * durationLimitMsはミリ秒単位の正の整数とする。未指定の場合は5000を使い、空文字・不正な値・複数指定はエラーとする。
 * 既定値を使う場合は、URLにdurationLimitMsを含めない。
 * outsideTransfersには改札外乗換を許可する地点のIDをカンマ区切りで指定する。
 * 未指定の場合は全地点を許可し、空文字・不正なID・複数指定はエラーとする。
 * 同じIDの重複は除去する。全地点選択時のURLではoutsideTransfersを省略する。
 * requiredOutsideTransfersには、経路内で必ず改札外乗換する地点のIDをカンマ区切りで指定する。
 * 未指定の場合や空文字の場合は必須地点なしとする。必須地点が空配列なら、このパラメータをURLに含めない。
 * 不正なID、複数指定、許可していない地点の指定、回数上限を超える数の指定はエラーにする。同じIDの重複は除去する。
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
