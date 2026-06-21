import { describe, expect, it } from 'vitest';
import { compareTimesCarEstimate } from './calc';

describe('compareTimesCarEstimate', () => {
    it('通常利用で20kmを超えて走行すると20km超過分の距離料金を含むカーシェア総額を返すこと', () => {
        expect(
            compareTimesCarEstimate({
                carShareUsageFee: 5000,
                rentalCarUsageFee: 6000,
                distanceKm: 50,
                gasolinePricePerLiter: 180,
                fuelEfficiencyKmPerLiter: 15,
                carShareDistanceChargeMode: 'after20km',
            }),
        ).toEqual({
            carShareTotal: 5600,
            rentalCarTotal: 6600,
            difference: 1000,
            cheaperService: 'carShare',
        });
    });

    it('全距離課金を選ぶと利用距離全体の距離料金を含むカーシェア総額を返すこと', () => {
        expect(
            compareTimesCarEstimate({
                carShareUsageFee: 5000,
                rentalCarUsageFee: 6000,
                distanceKm: 50,
                gasolinePricePerLiter: 180,
                fuelEfficiencyKmPerLiter: 15,
                carShareDistanceChargeMode: 'allDistance',
            }),
        ).toEqual({
            carShareTotal: 6000,
            rentalCarTotal: 6600,
            difference: 600,
            cheaperService: 'carShare',
        });
    });

    it('ガソリン代に円未満の端数が出る場合は四捨五入したレンタカー総額を返すこと', () => {
        expect(
            compareTimesCarEstimate({
                carShareUsageFee: 8000,
                rentalCarUsageFee: 5000,
                distanceKm: 100,
                gasolinePricePerLiter: 173,
                fuelEfficiencyKmPerLiter: 12,
                carShareDistanceChargeMode: 'after20km',
            }),
        ).toMatchObject({
            rentalCarTotal: 6442,
            cheaperService: 'rentalCar',
        });
    });

    it('カーシェア総額とレンタカー総額が同じ場合は差額0円として同額判定を返すこと', () => {
        expect(
            compareTimesCarEstimate({
                carShareUsageFee: 3400,
                rentalCarUsageFee: 4000,
                distanceKm: 100,
                gasolinePricePerLiter: 150,
                fuelEfficiencyKmPerLiter: 15,
                carShareDistanceChargeMode: 'after20km',
            }),
        ).toEqual({
            carShareTotal: 5000,
            rentalCarTotal: 5000,
            difference: 0,
            cheaperService: 'same',
        });
    });
});
