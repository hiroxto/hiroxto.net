export type CarShareDistanceChargeMode = 'after20km' | 'allDistance';

export type CheaperService = 'carShare' | 'rentalCar' | 'same';

export interface TimesCarEstimateComparisonInput {
    carShareUsageFee: number;
    rentalCarUsageFee: number;
    distanceKm: number;
    gasolinePricePerLiter: number;
    fuelEfficiencyKmPerLiter: number;
    carShareDistanceChargeMode: CarShareDistanceChargeMode;
}

export interface TimesCarEstimateComparisonResult {
    carShareTotal: number;
    rentalCarTotal: number;
    difference: number;
    cheaperService: CheaperService;
}
