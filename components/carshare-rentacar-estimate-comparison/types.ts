import type { InputValue, ServiceId, ToyotaPlan } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

export interface ComparisonEntry {
    id: string;
    service: ServiceId;
    number: number;
    usageFee: InputValue;
    allDistance: boolean;
    toyotaPlan: ToyotaPlan;
    toyotaHours: InputValue;
}

export type ComparisonEntryChanges = Partial<
    Pick<ComparisonEntry, 'usageFee' | 'allDistance' | 'toyotaPlan' | 'toyotaHours'>
>;
