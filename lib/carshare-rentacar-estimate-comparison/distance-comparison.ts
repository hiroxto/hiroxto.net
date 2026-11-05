import { type InputValue, prepareServiceEstimate } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

export type DistanceCandidate = Omit<
    Parameters<typeof prepareServiceEstimate>[0],
    'gasolinePrice' | 'fuelEfficiency'
> & { id: string; label: string };

export interface DistanceRange {
    minKm: number;
    maxKm: number;
}

export interface DistancePoint {
    distanceKm: number;
    totals: number[];
}

export interface CheapestDistanceBand {
    startKm: number;
    endKm: number;
    candidateIds: string[];
}

export const maximumChartDistanceKm = 10000;

/** グラフ専用の範囲。0〜10000km、0.1km刻み、下限より大きい上限を必要とする。既存の走行距離入力には適用しない。 */
export const parseDistanceRange = (min: InputValue, max: InputValue): DistanceRange | null => {
    const values = [min, max].map((value) => (typeof value === 'string' && value.trim() === '' ? NaN : Number(value)));
    if (
        values.some(
            (value) =>
                !Number.isFinite(value) ||
                value < 0 ||
                value > maximumChartDistanceKm ||
                Math.abs(value * 10 - Math.round(value * 10)) > 1e-8,
        )
    )
        return null;
    const [minKm, maxKm] = values;
    return minKm < maxKm ? { minKm, maxKm } : null;
};

/**
 * 距離以外の料金条件を候補ごとに一度検証し、通常の見積もりと同じ計算式・円単位の丸めで比較する。
 * 料金条件を検証できた候補のみ対象とし、共通の走行距離の未入力には影響されない。
 * 整数の十分の一kmを列挙し、両端を含む全0.1km地点で最安候補のID集合を比較する。
 * 同額帯への出入り、単一点だけの同額も区間として保持する。2候補未満では最安区間を返さない。
 * 区間端点は標本地点であり、連続的な料金曲線の厳密な交点ではない。
 * 描画点は最大502点（両端・20kmを含む）に間引くが、最安区間の探索は間引かない。
 */
export const compareDistances = (input: {
    candidates: DistanceCandidate[];
    gasolinePrice: InputValue;
    fuelEfficiency: InputValue;
    range: DistanceRange;
}): {
    candidates: DistanceCandidate[];
    incompleteCandidateIds: string[];
    points: DistancePoint[];
    bands: CheapestDistanceBand[];
} => {
    const { gasolinePrice, fuelEfficiency, range } = input;
    const candidates: DistanceCandidate[] = [];
    const incompleteCandidateIds: string[] = [];
    const estimatesAt: NonNullable<ReturnType<typeof prepareServiceEstimate>>[] = [];
    for (const candidate of input.candidates) {
        const estimateAt = prepareServiceEstimate({ ...candidate, gasolinePrice, fuelEfficiency });
        if (estimateAt) {
            candidates.push(candidate);
            estimatesAt.push(estimateAt);
        } else incompleteCandidateIds.push(candidate.id);
    }
    const points: DistancePoint[] = [];
    const bands: CheapestDistanceBand[] = [];
    if (!parseDistanceRange(range.minKm, range.maxKm) || candidates.length === 0)
        return { candidates, incompleteCandidateIds, points, bands };

    const minTenth = Math.round(range.minKm * 10);
    const maxTenth = Math.round(range.maxKm * 10);
    const drawingStep = Math.max(1, Math.ceil((maxTenth - minTenth) / 500));
    const totals: number[] = [];
    const candidateIds: string[] = [];
    for (let tenth = minTenth; tenth <= maxTenth; tenth++) {
        const distanceKm = tenth / 10;
        const isDrawingPoint = (tenth - minTenth) % drawingStep === 0 || tenth === maxTenth || tenth === 200;
        if (!isDrawingPoint && candidates.length < 2) continue;

        let lowest = Infinity;
        for (let index = 0; index < estimatesAt.length; index++) {
            const total = estimatesAt[index](distanceKm).total;
            totals[index] = total;
            lowest = Math.min(lowest, total);
        }
        if (isDrawingPoint) points.push({ distanceKm, totals: [...totals] });
        if (candidates.length < 2) continue;

        candidateIds.length = 0;
        for (let index = 0; index < candidates.length; index++) {
            if (totals[index] === lowest) candidateIds.push(candidates[index].id);
        }
        const previous = bands.at(-1);
        if (
            previous &&
            previous.candidateIds.length === candidateIds.length &&
            previous.candidateIds.every((id, index) => id === candidateIds[index])
        )
            previous.endKm = distanceKm;
        else bands.push({ startKm: distanceKm, endKm: distanceKm, candidateIds: [...candidateIds] });
    }
    return { candidates, incompleteCandidateIds, points, bands };
};
