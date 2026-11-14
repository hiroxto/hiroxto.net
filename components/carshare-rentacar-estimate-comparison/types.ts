import type { InputValue, ServiceId, ToyotaPlan } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

export interface ComparisonEntry {
    id: string;
    service: ServiceId;
    number: number;
    label: string;
    usageFee: InputValue;
    allDistance: boolean;
    toyotaPlan: ToyotaPlan;
    toyotaHours: InputValue;
}

export type ComparisonEntryChanges = Partial<
    Pick<ComparisonEntry, 'label' | 'usageFee' | 'allDistance' | 'toyotaPlan' | 'toyotaHours'>
>;

export interface ComparisonSnapshot {
    selected: ComparisonEntry[];
    distanceKm: InputValue;
    gasolinePrice: InputValue;
    fuelEfficiency: InputValue;
}
