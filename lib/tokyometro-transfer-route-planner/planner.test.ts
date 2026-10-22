import { describe, expect, it } from 'vitest';
import { buildPlannerResult, getPlannerLineOptions, getPlannerStationOptions, type PlannerState } from './planner';

describe('経路作成の候補と完成判定', () => {
    it('降車駅への徒歩到達しか残らない接続駅を無効化し、直接乗車できる降車駅は選択可能にする', () => {
        const options = getPlannerStationOptions(
            {
                fromStationId: 'kyobashi',
                toStationId: 'shintomicho',
                rows: [
                    { lineId: 'ginza', stationId: 'ginza', transferType: null },
                    { lineId: 'yurakucho', stationId: null, transferType: 'outside' },
                ],
            },
            1,
        );
        expect(options.find((option) => option.value === 'yurakucho')).toMatchObject({ disabled: true });
        expect(options.find((option) => option.value === 'shintomicho')).toMatchObject({ disabled: false });
    });
    it('降車駅までの運賃より途中の改札外出場駅への運賃が高ければ高い方を採用する', () => {
        // 虎ノ門→赤坂は初乗り運賃。虎ノ門→上野は6.6kmで209円/210円。
        const result = buildPlannerResult({
            fromStationId: 'toranomon',
            toStationId: 'akasaka',
            rows: [
                { lineId: 'ginza', stationId: 'ueno', transferType: null },
                { lineId: 'hibiya', stationId: 'kita-senju', transferType: 'outside' },
                { lineId: 'chiyoda', stationId: 'akasaka', transferType: 'inside' },
            ],
        });
        expect(result).toMatchObject({ fare: { ic: 209, ticket: 210 }, outsideTransferCount: 1 });
        expect(result?.fareCheckpoints).toEqual([
            { stationId: 'ueno', shortestDistanceTenths: 66, fare: { ic: 209, ticket: 210 } },
        ]);
    });

    it('乗換なしで降車駅へ到達すれば改札外0回で完成する', () => {
        const result = buildPlannerResult({
            fromStationId: 'inaricho',
            toStationId: 'asakusa',
            rows: [{ lineId: 'ginza', stationId: 'asakusa', transferType: null }],
        });
        expect(result).toMatchObject({
            outsideTransferCount: 0,
            insideTransferCount: 0,
            fare: { ic: 178, ticket: 180 },
        });
    });

    it('異駅名乗換の前後両駅と改札外回数を結果へ記録する', () => {
        const result = buildPlannerResult({
            fromStationId: 'kyobashi',
            toStationId: 'shintomicho',
            rows: [
                { lineId: 'ginza', stationId: 'ginza', transferType: null },
                { lineId: 'yurakucho', stationId: 'shintomicho', transferType: 'outside' },
            ],
        });
        expect(result).toMatchObject({ outsideTransferCount: 1, insideTransferCount: 0 });
        expect(result?.transfers).toEqual([
            {
                fromStationId: 'ginza',
                toStationId: 'ginza-itchome',
                fromLineId: 'ginza',
                toLineId: 'yurakucho',
                type: 'outside',
            },
        ]);
        expect(result?.fareCheckpoints[0].stationId).toBe('ginza');
    });

    it('大手町で改札内を指定すれば改札内乗換として集計する', () => {
        expect(
            buildPlannerResult({
                fromStationId: 'tokyo',
                toStationId: 'takebashi',
                rows: [
                    { lineId: 'marunouchi', stationId: 'otemachi', transferType: null },
                    { lineId: 'tozai', stationId: 'takebashi', transferType: 'inside' },
                ],
            }),
        ).toMatchObject({ outsideTransferCount: 0, insideTransferCount: 1 });
    });

    it('乗車済みの駅を通る接続駅は候補に残して無効にする', () => {
        const state: PlannerState = {
            fromStationId: 'kyobashi',
            toStationId: 'asakusa',
            rows: [
                { lineId: 'ginza', stationId: 'ginza', transferType: null },
                { lineId: 'marunouchi', stationId: 'akasaka-mitsuke', transferType: 'inside' },
                { lineId: 'ginza', stationId: null, transferType: 'inside' },
            ],
        };
        expect(getPlannerStationOptions(state, 2).find((option) => option.value === 'nihombashi')).toMatchObject({
            disabled: true,
        });
    });

    it('降車駅を通り越す接続駅も表示したまま無効にする', () => {
        const state: PlannerState = {
            fromStationId: 'inaricho',
            toStationId: 'ueno',
            rows: [{ lineId: 'ginza', stationId: null, transferType: null }],
        };
        expect(getPlannerStationOptions(state, 0).find((option) => option.value === 'ginza')).toMatchObject({
            disabled: true,
        });
        expect(getPlannerStationOptions(state, 0).find((option) => option.value === 'ueno')).toMatchObject({
            disabled: false,
        });
    });

    it('局所的には乗車できても訪問済み駅に阻まれて降車駅へ到達できない接続駅を無効にする', () => {
        // 北綾瀬へ入るには綾瀬を通る必要がある。北千住まで乗ると綾瀬を再訪する。
        const state: PlannerState = {
            fromStationId: 'ayase',
            toStationId: 'kita-ayase',
            rows: [{ lineId: 'chiyoda', stationId: null, transferType: null }],
        };
        expect(getPlannerStationOptions(state, 0).find((option) => option.value === 'kita-senju')).toMatchObject({
            disabled: true,
        });
        expect(getPlannerStationOptions(state, 0).find((option) => option.value === 'kita-ayase')).toMatchObject({
            disabled: false,
        });
    });

    it('完成できない路線も路線候補から除外・無効化しない', () => {
        const state: PlannerState = {
            fromStationId: 'ayase',
            toStationId: 'kita-ayase',
            rows: [
                { lineId: 'chiyoda', stationId: 'kita-senju', transferType: null },
                { lineId: null, stationId: null, transferType: null },
            ],
        };
        expect(getPlannerLineOptions(state, 1)).toContainEqual(
            expect.objectContaining({ value: 'hibiya', disabled: false }),
        );
    });

    it('丸ノ内線の方南町支線から本線までを乗換なしの区間として扱う', () => {
        expect(
            buildPlannerResult({
                fromStationId: 'honancho',
                toStationId: 'shinjuku',
                rows: [{ lineId: 'marunouchi', stationId: 'shinjuku', transferType: null }],
            }),
        ).toMatchObject({ outsideTransferCount: 0, insideTransferCount: 0, actualDistanceTenths: 51 });
    });

    it('未完成・不正な駅・同一発着・徒歩だけの終着を完成にしない', () => {
        expect(buildPlannerResult({ fromStationId: null, toStationId: 'asakusa', rows: [] })).toBeNull();
        expect(buildPlannerResult({ fromStationId: 'asakusa', toStationId: 'asakusa', rows: [] })).toBeNull();
        expect(
            buildPlannerResult({
                fromStationId: 'unknown',
                toStationId: 'asakusa',
                rows: [],
            } as unknown as PlannerState),
        ).toBeNull();
        expect(
            buildPlannerResult({
                fromStationId: 'kyobashi',
                toStationId: 'ginza-itchome',
                rows: [
                    { lineId: 'ginza', stationId: 'ginza', transferType: null },
                    { lineId: 'yurakucho', stationId: 'ginza-itchome', transferType: 'outside' },
                ],
            }),
        ).toBeNull();
    });
});
