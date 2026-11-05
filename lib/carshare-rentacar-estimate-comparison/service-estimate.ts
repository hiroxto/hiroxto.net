export type ServiceId = keyof typeof serviceDetails;
export type InputValue = string | number;
export type ToyotaPlan = 'short' | '6' | '12' | '24';

export const serviceDetails = {
    rentalCar: { id: 'rentalCar', label: 'レンタカー', url: null },
    timesCar: { id: 'timesCar', label: 'タイムズカー', url: 'https://share.timescar.jp/fare/use.html' },
    toyotaShare: { id: 'toyotaShare', label: 'トヨタシェア', url: 'https://mobility.toyota.jp/r-toyotashare/price/' },
} as const;
export const services = Object.values(serviceDetails);

const parseNumber = (value: InputValue): number | null => {
    if (typeof value === 'string' && value.trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
};

interface ServiceEstimateInput {
    service: ServiceId;
    distanceKm: InputValue;
    gasolinePrice: InputValue;
    fuelEfficiency: InputValue;
    usageFee: InputValue;
    allDistance: boolean;
    toyotaPlan: ToyotaPlan;
    toyotaHours: InputValue;
}

/**
 * 比較画面の試作向け概算。空欄・非有限値・負数は未計算とし、同一サービスの複数の比較対象も、それぞれ独立して計算する。
 * 共通の走行距離を使い、レンタカーのみ共通のガソリン単価と燃費（正数）を必要とする。
 * レンタカーは会社を限定せず、入力した利用料金に共通条件で求めた燃料代を加算する。
 * タイムズカーは20km超過分、または全距離に20円/kmを加算する。
 * トヨタシェアはC1基本料金に限定。ショート設定車両の6時間以内は15分220円・距離料金込み。
 * パックは6/12/24時間の5610/5940/7810円に全距離16円/kmを加算する。
 * パック時間を使い切る想定で、超過・最安組合せ・季節料金・オプションは対象外。
 * 出典: https://mobility.toyota.jp/r-toyotashare/price/ （2026-11-03確認）
 * 金額は円単位に四捨五入する。
 */
export const prepareServiceEstimate = (input: Omit<ServiceEstimateInput, 'distanceKm'>) => {
    let usageFee = parseNumber(input.usageFee);
    let runningCostAt: (distanceKm: number) => number;
    if (input.service === 'toyotaShare') {
        if (input.toyotaPlan === 'short') {
            const hours = parseNumber(input.toyotaHours);
            if (hours === null || hours <= 0 || hours > 6) return null;
            usageFee = Math.ceil((hours * 60) / 15) * 220;
            runningCostAt = () => 0;
        } else {
            usageFee = { '6': 5610, '12': 5940, '24': 7810 }[input.toyotaPlan];
            runningCostAt = (distance) => Math.round(distance * 16);
        }
    } else if (input.service === 'timesCar') {
        runningCostAt = (distance) => Math.round((input.allDistance ? distance : Math.max(distance - 20, 0)) * 20);
    } else {
        const gasolinePrice = parseNumber(input.gasolinePrice);
        const fuelEfficiency = parseNumber(input.fuelEfficiency);
        if (gasolinePrice === null || fuelEfficiency === null || fuelEfficiency === 0) return null;
        runningCostAt = (distance) => Math.round((distance / fuelEfficiency) * gasolinePrice);
    }
    if (usageFee === null) return null;

    // 距離以外の入力を検証済みの見積もり。呼び出し元で有効な距離を渡す。
    const fee = usageFee;
    return (distanceKm: number) => {
        const runningCost = runningCostAt(distanceKm);
        return { usageFee: Math.round(fee), runningCost, total: Math.round(fee + runningCost) };
    };
};

export const estimateService = (input: ServiceEstimateInput) => {
    const distance = parseNumber(input.distanceKm);
    if (distance === null) return null;
    const estimateAt = prepareServiceEstimate(input);
    return estimateAt === null ? null : estimateAt(distance);
};
