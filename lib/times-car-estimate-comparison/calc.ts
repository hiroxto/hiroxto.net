import type {
    CarShareDistanceChargeMode,
    CheaperService,
    TimesCarEstimateComparisonInput,
    TimesCarEstimateComparisonResult,
} from './types';

const timesCarDistanceChargePerKm = 20;
const distanceChargeFreeKm = 20;

const calcCarShareDistanceCharge = (
    distanceKm: number,
    carShareDistanceChargeMode: CarShareDistanceChargeMode,
): number => {
    const chargeableDistanceKm =
        carShareDistanceChargeMode === 'after20km' ? Math.max(distanceKm - distanceChargeFreeKm, 0) : distanceKm;

    return Math.round(chargeableDistanceKm * timesCarDistanceChargePerKm);
};

const calcRentalCarGasolineCost = (
    distanceKm: number,
    gasolinePricePerLiter: number,
    fuelEfficiencyKmPerLiter: number,
): number => Math.round((distanceKm / fuelEfficiencyKmPerLiter) * gasolinePricePerLiter);

export const compareTimesCarEstimate = (input: TimesCarEstimateComparisonInput): TimesCarEstimateComparisonResult => {
    const carShareDistanceCharge = calcCarShareDistanceCharge(input.distanceKm, input.carShareDistanceChargeMode);
    const rentalCarGasolineCost = calcRentalCarGasolineCost(
        input.distanceKm,
        input.gasolinePricePerLiter,
        input.fuelEfficiencyKmPerLiter,
    );
    const carShareTotal = Math.round(input.carShareUsageFee + carShareDistanceCharge);
    const rentalCarTotal = Math.round(input.rentalCarUsageFee + rentalCarGasolineCost);
    const difference = Math.abs(carShareTotal - rentalCarTotal);
    let cheaperService: CheaperService = 'same';

    if (carShareTotal < rentalCarTotal) {
        cheaperService = 'carShare';
    } else if (rentalCarTotal < carShareTotal) {
        cheaperService = 'rentalCar';
    }

    return {
        carShareTotal,
        rentalCarTotal,
        difference,
        cheaperService,
    };
};
