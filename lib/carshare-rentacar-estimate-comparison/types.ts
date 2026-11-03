export type CarShareDistanceChargeMode = 'after20km' | 'allDistance';

export type CheaperService = 'carShare' | 'rentalCar' | 'same';

export interface CarshareRentacarEstimateComparisonInput {
    carShareUsageFee: number;
    rentalCarUsageFee: number;
    distanceKm: number;
    gasolinePricePerLiter: number;
    fuelEfficiencyKmPerLiter: number;
    carShareDistanceChargeMode: CarShareDistanceChargeMode;
}

export interface CarshareRentacarEstimateComparisonResult {
    carShareTotal: number;
    rentalCarTotal: number;
    difference: number;
    cheaperService: CheaperService;
}
