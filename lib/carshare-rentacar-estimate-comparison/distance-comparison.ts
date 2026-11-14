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
 * 料金条件が有効な候補だけを比較する。共通の走行距離が未入力でも比較できる。
 * 距離を0.1km単位の整数で扱い、範囲の両端を含めて0.1km刻みで最安候補のID集合を比較する。
 * 最安候補の組み合わせが変わるたびに区間を分ける。複数の候補が同額になる地点が1点だけでも、区間として保持する。
 * 比較対象が2候補未満の場合、最安区間は返さない。
 * 区間の端点には比較した地点を使う。料金曲線の厳密な交点は計算しない。
 * グラフの描画点は両端と範囲内の20km地点を含めて最大502点に絞る。最安区間は0.1km刻みの全地点を使って求める。
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
