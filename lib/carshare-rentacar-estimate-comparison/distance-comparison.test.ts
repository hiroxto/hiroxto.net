import { describe, expect, it } from 'vitest';
import { compareDistances, type DistanceCandidate, parseDistanceRange } from './distance-comparison';

const rental = (id: string, usageFee: number): DistanceCandidate => ({
    id,
    label: id,
    service: 'rentalCar',
    usageFee,
    allDistance: false,
    toyotaPlan: '12',
    toyotaHours: '',
});
const times = (id: string, usageFee: number, allDistance = false): DistanceCandidate => ({
    ...rental(id, usageFee),
    service: 'timesCar',
    allDistance,
});
const compare = (candidates: DistanceCandidate[], minKm = 0, maxKm = 5, gasolinePrice = 1, fuelEfficiency = 1) =>
    compareDistances({ candidates, gasolinePrice, fuelEfficiency, range: { minKm, maxKm } });

describe('parseDistanceRange', () => {
    it('0.1km刻みの範囲と上限10000kmを受け付ける', () => {
        expect(parseDistanceRange('0.1', '0.3')).toEqual({ minKm: 0.1, maxKm: 0.3 });
        expect(parseDistanceRange(0, 10000)).toEqual({ minKm: 0, maxKm: 10000 });
    });
    it.each([
        ['', 5],
        [0, ''],
        [-0.1, 5],
        [0, 10000.1],
        [5, 5],
        [5, 4],
        [0.01, 5],
        [0, Number.NaN],
        [0, Infinity],
    ])('無効な範囲 %s〜%s を拒否する', (min, max) => expect(parseDistanceRange(min, max)).toBeNull());
});

describe('compareDistances', () => {
    it('円丸めで生じる同額帯への遷移と、同額帯からの遷移を両方返す', () => {
        // A=100+round(km)、B=102円。1.5〜2.4kmが同額、2.5kmからBが最安。
        const result = compare([rental('A', 100), times('B', 102)]);
        expect(result.bands).toEqual([
            { startKm: 0, endKm: 1.4, candidateIds: ['A'] },
            { startKm: 1.5, endKm: 2.4, candidateIds: ['A', 'B'] },
            { startKm: 2.5, endKm: 5, candidateIds: ['B'] },
        ]);
    });
    it('タイムズの20km境界を挟む複数回の最安切替を返す', () => {
        // A=100+10円/km、B=200+20円/km(20km超過分)。10kmと30kmで同額。
        const result = compare([rental('A', 100), times('B', 200)], 0, 40, 100, 10);
        expect(result.bands).toEqual([
            { startKm: 0, endKm: 9.9, candidateIds: ['A'] },
            { startKm: 10, endKm: 10, candidateIds: ['A', 'B'] },
            { startKm: 10.1, endKm: 29.9, candidateIds: ['B'] },
            { startKm: 30, endKm: 30, candidateIds: ['A', 'B'] },
            { startKm: 30.1, endKm: 40, candidateIds: ['A'] },
        ]);
        expect(result.points.find(({ distanceKm }) => distanceKm === 20)?.totals).toEqual([300, 200]);
    });
    it('最安でない2候補が交差しても最安集合の変化として返さない', () => {
        expect(compare([rental('A', 100), times('B', 102), times('C', 0)]).bands).toEqual([
            { startKm: 0, endKm: 5, candidateIds: ['C'] },
        ]);
    });
    it('全区間が同額の場合は全IDを保持した単一区間を返す', () => {
        expect(compare([times('A', 100), times('B', 100)]).bands).toEqual([
            { startKm: 0, endKm: 5, candidateIds: ['A', 'B'] },
        ]);
    });
    it('0.1kmの端点を含め、指定範囲内だけの区間を返す', () => {
        expect(compare([rental('A', 100), times('B', 102)], 1.5, 2.5).bands).toEqual([
            { startKm: 1.5, endKm: 2.4, candidateIds: ['A', 'B'] },
            { startKm: 2.5, endKm: 2.5, candidateIds: ['B'] },
        ]);
        expect(compare([rental('A', 0)], 0.1, 0.3).points).toEqual([
            { distanceKm: 0.1, totals: [0] },
            { distanceKm: 0.2, totals: [0] },
            { distanceKm: 0.3, totals: [0] },
        ]);
    });
    it('描画点を省略しても0.1km刻みの短い同額帯を検出する', () => {
        const result = compare([rental('A', 100), times('B', 102)], 0, 500);
        expect(result.points.length).toBeLessThanOrEqual(502);
        expect(result.bands[1]).toEqual({ startKm: 1.5, endKm: 2.4, candidateIds: ['A', 'B'] });
        expect(result.points.at(-1)).toEqual({ distanceKm: 500, totals: [600, 9702] });
    });
    it('トヨタのプランと時間、利用料金の端数を既存見積どおりに反映する', () => {
        const result = compare(
            [
                { ...rental('short', 0), service: 'toyotaShare', toyotaPlan: 'short', toyotaHours: 1.1 },
                { ...rental('pack', 0), service: 'toyotaShare', toyotaPlan: '6' },
                times('times', 100.6, true),
            ],
            0,
            0.1,
        );
        expect(result.points).toEqual([
            { distanceKm: 0, totals: [1100, 5610, 101] },
            { distanceKm: 0.1, totals: [1100, 5612, 103] },
        ]);
    });
    it('未入力候補を除外し1候補なら描画点のみ返し、閾値比較しない', () => {
        const result = compareDistances({
            candidates: [rental('missing', 100), times('ready', 20)],
            gasolinePrice: '',
            fuelEfficiency: 10,
            range: { minKm: 0, maxKm: 0.1 },
        });
        expect(result.candidates.map(({ id }) => id)).toEqual(['ready']);
        expect(result.incompleteCandidateIds).toEqual(['missing']);
        expect(result.points).toEqual([
            { distanceKm: 0, totals: [20] },
            { distanceKm: 0.1, totals: [20] },
        ]);
        expect(result.bands).toEqual([]);
    });
    it('候補なし・全候補が未入力なら描画点も区間も返さない', () => {
        expect(compare([])).toMatchObject({ candidates: [], points: [], bands: [] });
        expect(compare([{ ...times('A', 100), usageFee: '' }])).toMatchObject({
            candidates: [],
            points: [],
            bands: [],
            incompleteCandidateIds: ['A'],
        });
    });
    it('無効な範囲では計算しない', () => {
        expect(compare([times('A', 100)], 0, 10001).points).toEqual([]);
    });
});
