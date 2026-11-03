import { describe, expect, it } from 'vitest';
import { parseCarshareRentacarEstimateComparisonInput } from '@/lib/carshare-rentacar-estimate-comparison/validation';

const validInput = {
    carShareUsageFee: 1000,
    rentalCarUsageFee: 2000,
    distanceKm: 100,
    gasolinePricePerLiter: 175,
    fuelEfficiencyKmPerLiter: 15,
    carShareDistanceChargeMode: 'after20km' as const,
};

describe('parseCarshareRentacarEstimateComparisonInput', () => {
    it('数値文字列を数値へ変換して比較用の入力を返す', () => {
        expect(
            parseCarshareRentacarEstimateComparisonInput({
                carShareUsageFee: ' 1000 ',
                rentalCarUsageFee: '2000',
                distanceKm: '100.5',
                gasolinePricePerLiter: '175',
                fuelEfficiencyKmPerLiter: '15',
                carShareDistanceChargeMode: 'allDistance',
            }),
        ).toEqual({
            carShareUsageFee: 1000,
            rentalCarUsageFee: 2000,
            distanceKm: 100.5,
            gasolinePricePerLiter: 175,
            fuelEfficiencyKmPerLiter: 15,
            carShareDistanceChargeMode: 'allDistance',
        });
    });

    it('料金・距離・単価が0で燃費が正の場合は受け付ける', () => {
        expect(
            parseCarshareRentacarEstimateComparisonInput({
                ...validInput,
                carShareUsageFee: 0,
                rentalCarUsageFee: '0',
                distanceKm: 0,
                gasolinePricePerLiter: 0,
                fuelEfficiencyKmPerLiter: 0.1,
            }),
        ).toMatchObject({
            carShareUsageFee: 0,
            rentalCarUsageFee: 0,
            distanceKm: 0,
            gasolinePricePerLiter: 0,
            fuelEfficiencyKmPerLiter: 0.1,
        });
    });

    describe.each([
        'carShareUsageFee',
        'rentalCarUsageFee',
        'distanceKm',
        'gasolinePricePerLiter',
        'fuelEfficiencyKmPerLiter',
    ])('%s', (field) => {
        it.each([
            '',
            '   ',
            'invalid',
            'NaN',
            'Infinity',
            '-Infinity',
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            -1,
            '-0.1',
        ])('不正な値 %s では比較用の入力を返さない', (value) => {
            expect(parseCarshareRentacarEstimateComparisonInput({ ...validInput, [field]: value })).toBeNull();
        });
    });

    it.each([0, '0'])('燃費が %s の場合は比較用の入力を返さない', (value) => {
        expect(
            parseCarshareRentacarEstimateComparisonInput({ ...validInput, fuelEfficiencyKmPerLiter: value }),
        ).toBeNull();
    });
});
