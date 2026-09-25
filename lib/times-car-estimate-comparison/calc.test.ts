import { describe, expect, it } from 'vitest';
import { compareTimesCarEstimate } from './calc';

describe('compareTimesCarEstimate', () => {
    it('通常利用で20 kmを超えた場合は、超過分の距離料金をカーシェア総額に加える', () => {
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

    it('全距離課金では、走行距離全体の距離料金をカーシェア総額に加える', () => {
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

    it('ガソリン代に1円未満の端数が出た場合は四捨五入してレンタカー総額を返す', () => {
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

    it('両サービスの総額が同じ場合は差額0円と同額判定を返す', () => {
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
