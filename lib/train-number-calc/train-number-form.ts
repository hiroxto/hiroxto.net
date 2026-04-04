import { z } from 'zod';

export const trainNumberValueSchema = z
    .string()
    .regex(/^\d+$/, '列車番号は数字のみで入力してください。')
    .refine((value) => !value.startsWith('0'), '先頭を0にすることはできません。')
    .refine((value) => {
        const parsed = Number.parseInt(value, 10);
        return parsed >= 1 && parsed <= 9999;
    }, '列車番号は1〜9999の範囲で入力してください。');

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
