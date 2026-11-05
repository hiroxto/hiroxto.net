import { z } from 'zod';
import { isSameStation, stationIdSchema } from '@/lib/tokyometro-core/stations';
import { outsideTransferIdSchema, outsideTransferIdsSchema } from '@/lib/tokyometro-transfer-search/outside-transfers';

/** 利用者が指定できる改札外乗換回数の上限。 */
export const MAX_OUTSIDE_TRANSFER_COUNT = 14;

const invalidMaximumOutsideTransferCountMessage = `最大改札外乗換回数は1〜${MAX_OUTSIDE_TRANSFER_COUNT}回で指定してください`;
export const maximumOutsideTransferCountSchema = z
    .number({ error: invalidMaximumOutsideTransferCountMessage })
    .int(invalidMaximumOutsideTransferCountMessage)
    .min(1, invalidMaximumOutsideTransferCountMessage)
    .max(MAX_OUTSIDE_TRANSFER_COUNT, invalidMaximumOutsideTransferCountMessage);

/** 必須地点は利用許可の部分集合とし、指定した最大回数以内に収める。未指定は必須地点なし。 */
export const outsideTransferConditionsSchema = z
    .object({
        outsideTransferIds: outsideTransferIdsSchema,
        requiredOutsideTransferIds: z
            .array(outsideTransferIdSchema)
            .transform((ids) => [...new Set(ids)])
            .default([]),
        maximumOutsideTransferCount: maximumOutsideTransferCountSchema.nullable().default(null),
    })
    .superRefine(({ outsideTransferIds, requiredOutsideTransferIds, maximumOutsideTransferCount }, context) => {
        if (requiredOutsideTransferIds.some((id) => !outsideTransferIds.includes(id))) {
            context.addIssue({
                code: 'custom',
                message: '必須の改札外乗換駅は「利用する改札外乗換駅」でも選択してください',
            });
        }
        if (maximumOutsideTransferCount != null && requiredOutsideTransferIds.length > maximumOutsideTransferCount) {
            context.addIssue({
                code: 'custom',
                message: '必須の改札外乗換駅の数が最大回数を超えています。最大回数を増やすか必須駅を減らしてください',
            });
        }
    });

export const searchBudgetSchema = z.object({
    visitLimit: z.number().int().nonnegative(),
    durationLimitMs: z.number().nonnegative(),
});

const invalidDurationMessage = '探索時間は正の整数で指定してください';
export const searchFormDurationSchema = z
    .number({ error: invalidDurationMessage })
    .int(invalidDurationMessage)
    .positive(invalidDurationMessage);

const stationPairSchema = z
    .object({
        fromStationId: z.string({ error: '乗車駅と降車駅を指定してください' }).pipe(stationIdSchema),
        toStationId: z.string({ error: '乗車駅と降車駅を指定してください' }).pipe(stationIdSchema),
    })
    .refine(
        ({ fromStationId, toStationId }) => !isSameStation(fromStationId, toStationId),
        '乗車駅と降車駅には異なる駅を指定してください',
    );

const searchFormSchema = z
    .object({
        durationLimitMs: searchFormDurationSchema,
        stations: stationPairSchema,
    })
    .and(outsideTransferConditionsSchema);

/**
 * 探索時間、発着駅、改札外乗換の利用許可・必須地点・最大回数の順に検証し、成功時は検索条件を返す。
 * 同じ駅IDと異駅名乗換駅同士の発着は同一駅として検証エラーにする。
 */
export const parseTokyoMetroTransferSearchForm = (input: {
    durationLimitMs: number;
    stations: { fromStationId: string | null; toStationId: string | null };
    outsideTransferIds: string[];
    requiredOutsideTransferIds?: string[];
    maximumOutsideTransferCount?: number | null;
}): { error: null; data: z.output<typeof searchFormSchema> } | { error: string; data: null } => {
    const result = searchFormSchema.safeParse(input);
    return result.success ? { error: null, data: result.data } : { error: result.error.issues[0].message, data: null };
};
