import { describe, expect, it } from 'vitest';
import { sakuradamonToAsakusaState } from '@/test/fixtures/tokyometro-transfer-route-planner';
import {
    buildPlannerPreview,
    buildPlannerResult,
    getPlannerLineOptions,
    getPlannerStationOptions,
    type PlannerState,
} from './planner';

describe('経路作成の候補と完成判定', () => {
    it('降車駅への徒歩到達しか残らない接続駅を無効化し、直接乗車できる降車駅は選択可能にする', () => {
        const options = getPlannerStationOptions(
            {
                fromStationId: 'kyobashi',
                toStationId: 'shintomicho',
                rows: [
                    { lineId: 'ginza', stationId: 'ginza' },
                    { lineId: 'yurakucho', stationId: null },
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
                { lineId: 'ginza', stationId: 'ueno' },
                { lineId: 'hibiya', stationId: 'kita-senju' },
                { lineId: 'chiyoda', stationId: 'akasaka' },
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
            rows: [{ lineId: 'ginza', stationId: 'asakusa' }],
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
                { lineId: 'ginza', stationId: 'ginza' },
                { lineId: 'yurakucho', stationId: 'shintomicho' },
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

    it('両種別が利用できる大手町では改札外乗換として自動集計する', () => {
        expect(
            buildPlannerResult({
                fromStationId: 'tokyo',
                toStationId: 'takebashi',
                rows: [
                    { lineId: 'marunouchi', stationId: 'otemachi' },
                    { lineId: 'tozai', stationId: 'takebashi' },
                ],
            }),
        ).toMatchObject({ outsideTransferCount: 1, insideTransferCount: 0 });
    });

    it('提示された長い経路では大手町も改札外に含めて14回と集計する', () => {
        const result = buildPlannerResult(sakuradamonToAsakusaState);
        expect(result).toMatchObject({
            outsideTransferCount: 14,
            insideTransferCount: 4,
            actualDistanceTenths: 437,
            shortestDistanceTenths: 82,
            fare: { ic: 209, ticket: 210 },
        });
        expect(result?.transfers).toContainEqual({
            fromStationId: 'otemachi',
            toStationId: 'otemachi',
            fromLineId: 'chiyoda',
            toLineId: 'marunouchi',
            type: 'outside',
        });
        expect(result?.fareCheckpoints.map(({ stationId }) => stationId)).toContain('otemachi');
    });

    it('乗車済みの駅を通る接続駅は候補に残して無効にする', () => {
        const state: PlannerState = {
            fromStationId: 'kyobashi',
            toStationId: 'asakusa',
            rows: [
                { lineId: 'ginza', stationId: 'ginza' },
                { lineId: 'marunouchi', stationId: 'akasaka-mitsuke' },
                { lineId: 'ginza', stationId: null },
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
            rows: [{ lineId: 'ginza', stationId: null }],
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
            rows: [{ lineId: 'chiyoda', stationId: null }],
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
                { lineId: 'chiyoda', stationId: 'kita-senju' },
                { lineId: null, stationId: null },
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
                rows: [{ lineId: 'marunouchi', stationId: 'shinjuku' }],
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
                    { lineId: 'ginza', stationId: 'ginza' },
                    { lineId: 'yurakucho', stationId: 'ginza-itchome' },
                ],
            }),
        ).toBeNull();
    });
});

describe('入力済み区間の計算', () => {
    const state: PlannerState = {
        fromStationId: 'asakusa',
        toStationId: 'akabane-iwabuchi',
        rows: [
            { lineId: 'ginza', stationId: 'toranomon' },
            { lineId: 'hibiya', stationId: 'hibiya' },
            { lineId: 'yurakucho', stationId: 'ikebukuro' },
            { lineId: 'marunouchi', stationId: null },
        ],
    };
    it('降車駅に未到達でも最後の入力済み接続駅までを計算する', () => {
        const preview = buildPlannerPreview(state);
        expect(preview).toMatchObject({
            fromStationId: 'asakusa',
            toStationId: 'ikebukuro',
            complete: false,
            result: { outsideTransferCount: 2, insideTransferCount: 0 },
        });
        expect(preview?.result.legs.map((leg) => leg.toStationId)).toEqual(['toranomon', 'hibiya', 'ikebukuro']);
        expect(preview?.result.fareCheckpoints.map((checkpoint) => checkpoint.stationId)).toEqual([
            'toranomon',
            'hibiya',
        ]);
        expect(buildPlannerResult(state)).toBeNull();
    });
    it('末尾の異駅名乗換で路線だけ選択されても乗換前の日比谷で計算を止める', () => {
        const preview = buildPlannerPreview({
            ...state,
            rows: [...state.rows.slice(0, 2), { lineId: 'yurakucho', stationId: null }],
        });
        expect(preview).toMatchObject({ toStationId: 'hibiya', complete: false, result: { outsideTransferCount: 1 } });
        expect(preview?.result.transfers.map((transfer) => transfer.fromStationId)).toEqual(['toranomon']);
        expect(preview?.result.legs.at(-1)?.toStationId).toBe('hibiya');
    });
    it('完成した経路は完成状態と計算区間を返す', () => {
        expect(
            buildPlannerPreview({
                fromStationId: 'inaricho',
                toStationId: 'asakusa',
                rows: [{ lineId: 'ginza', stationId: 'asakusa' }],
            }),
        ).toMatchObject({ fromStationId: 'inaricho', toStationId: 'asakusa', complete: true });
    });
    it('乗車区間が未入力または入力済み区間が不正なら計算しない', () => {
        expect(buildPlannerPreview({ ...state, rows: [{ lineId: 'ginza', stationId: null }] })).toBeNull();
        expect(buildPlannerPreview({ ...state, rows: [{ lineId: 'hibiya', stationId: 'hibiya' }] })).toBeNull();
    });
});
