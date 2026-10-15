import { z } from 'zod';
import type {
    CarShareDistanceChargeMode,
    TimesCarEstimateComparisonInput,
} from '@/lib/times-car-estimate-comparison/types';

const inputNumberSchema = z.union([z.number(), z.string().trim().min(1).transform(Number)]).pipe(z.number());

const timesCarEstimateComparisonInputSchema = z.object({
    carShareUsageFee: inputNumberSchema.pipe(z.number().nonnegative()),
    rentalCarUsageFee: inputNumberSchema.pipe(z.number().nonnegative()),
    distanceKm: inputNumberSchema.pipe(z.number().nonnegative()),
    gasolinePricePerLiter: inputNumberSchema.pipe(z.number().nonnegative()),
    fuelEfficiencyKmPerLiter: inputNumberSchema.pipe(z.number().positive()),
    carShareDistanceChargeMode: z.enum(['after20km', 'allDistance']),
});

type TimesCarEstimateComparisonFormInput = {
    [Key in Exclude<keyof TimesCarEstimateComparisonInput, 'carShareDistanceChargeMode'>]: string | number;
} & { carShareDistanceChargeMode: CarShareDistanceChargeMode };

/** 空欄・非有限値・負数・燃費0では結果を表示しない。数値文字列は数値に変換する。 */
export const parseTimesCarEstimateComparisonInput = (
    input: TimesCarEstimateComparisonFormInput,
): TimesCarEstimateComparisonInput | null => {
    const result = timesCarEstimateComparisonInputSchema.safeParse(input);
    return result.success ? result.data : null;
};
