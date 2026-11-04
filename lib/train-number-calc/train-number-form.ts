import { z } from 'zod';

/** 全角数字だけ半角化して検証し、計算に使う半角数字を返す。入力欄の文字列は変更しない。 */
export const trainNumberValueSchema = z
    .string()
    .transform((value) => value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0)))
    .pipe(
        z
            .string()
            .regex(/^\d+$/, '列車番号は数字のみで入力してください。')
            .refine((value) => !value.startsWith('0'), '先頭を0にすることはできません。')
            .refine((value) => {
                const parsed = Number.parseInt(value, 10);
                return parsed >= 1 && parsed <= 9999;
            }, '列車番号は1〜9999の範囲で入力してください。'),
    );

export const trainNumberSchema = z.object({
    trainNumber: z.union([z.literal(''), trainNumberValueSchema]),
});

export type TrainNumberFormValues = z.infer<typeof trainNumberSchema>;

export const getTrainNumberErrorMessage = (trainNumber: string): string | null => {
    const parseResult = trainNumberSchema.safeParse({ trainNumber });

    if (parseResult.success) {
        return null;
    }

    return parseResult.error.issues[0]?.message ?? '列車番号の入力に失敗しました。';
};
