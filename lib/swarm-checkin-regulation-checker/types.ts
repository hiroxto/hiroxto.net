export type PeriodUnit = 'minutes' | 'days';

export interface LabeledLatLng {
    label: string;
    lat: number;
    lng: number;
}

export interface Location {
    address: string;
    lat: number;
    lng: number;
    labeledLatLngs: LabeledLatLng[];
    postalCode: string;
    cc: string;
    city: string;
    state: string;
    country: string;
    formattedAddress: string[];
}

export interface Icon {
    prefix: string;
    suffix: string;
}

export interface Category {
    id: string;
    name: string;
    pluralName: string;
    shortName: string;
    icon: Icon;
    primary: true;
}

export interface Venue {
    id: string;
    name: string;
    location: Location;
    categories: Category[];
}

export interface CheckinItem {
    id: string;
    createdAt: number;
    type: string;
    timeZoneOffset: number;
    venue: Venue;
}

export interface Checkins {
    count: number;
    items: CheckinItem[];
}

export interface CheckinResponse {
    checkins: Checkins;
}

export interface CheckinResponseBody {
    response: CheckinResponse;
}

export interface LimitCheckResult {
    limit: number;
    checkins: CheckinItem[];
    period: {
        from: Date;
        to: Date;
        value: number;
        unit: PeriodUnit;
    };
    isLimited: boolean;
    unLimitingAt: Date | null;
}

export interface CheckinLimits {
    m2: LimitCheckResult;
    m15: LimitCheckResult;
    d1: LimitCheckResult;
}

export interface AllLimitCheckResult {
    limits: CheckinLimits;
    isLimited: boolean;
    unLimitingAts: Date | null;
}

export type ResultKey = keyof CheckinLimits;
