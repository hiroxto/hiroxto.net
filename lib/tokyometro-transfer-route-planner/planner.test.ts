import { describe, expect, it } from 'vitest';
import { sakuradamonToAsakusaState } from '@/test/fixtures/tokyometro-transfer-route-planner';
import {
    buildPlannerPreview,
    buildPlannerResult,
    getPlannerLineOptions,
    getPlannerStationError,
    getPlannerStationOptions,
    type PlannerState,
} from './planner';

describe('経路作成の候補と完成判定', () => {
    it('接続駅を駅番号順に並べ、乗換駅でない降車駅も路線上の位置へ含める', () => {
        const options = getPlannerStationOptions(
            {
                fromStationId: 'kyobashi',
                toStationId: 'tawaramachi',
                rows: [{ lineId: 'ginza', stationId: null }],
            },
            0,
        );
        expect(options.map((option) => option.value)).toEqual([
            'shibuya',
            'omote-sando',
            'aoyama-itchome',
            'akasaka-mitsuke',
            'tameike-sanno',
            'toranomon',
            'ginza',
            'nihombashi',
            'mitsukoshimae',
            'ueno-hirokoji',
            'ueno',
            'tawaramachi',
        ]);
        expect(options.find((option) => option.value === 'tawaramachi')).toMatchObject({ disabled: false });
    });
    it('反対方向に乗車する場合も接続駅は駅番号の昇順で表示する', () => {
        const options = getPlannerStationOptions(
            {
                fromStationId: 'asakusa',
                toStationId: 'shibuya',
                rows: [{ lineId: 'ginza', stationId: null }],
            },
            0,
        );
        expect(options.map((option) => option.value)).toEqual([
            'shibuya',
            'omote-sando',
            'aoyama-itchome',
            'akasaka-mitsuke',
            'tameike-sanno',
            'toranomon',
            'ginza',
            'nihombashi',
            'mitsukoshimae',
            'ueno-hirokoji',
            'ueno',
        ]);
    });
    it('丸ノ内線は本線の候補の後に支線の降車駅を表示する', () => {
        const options = getPlannerStationOptions(
            {
                fromStationId: 'ginza',
                toStationId: 'honancho',
                rows: [{ lineId: 'marunouchi', stationId: null }],
            },
            0,
        );
        const values = options.map((option) => option.value);
        expect(values).toEqual([
            'shinjuku-sanchome',
            'yotsuya',
            'akasaka-mitsuke',
            'kokkai-gijidomae',
            'kasumigaseki',
            'otemachi',
            'awajicho',
            'korakuen',
            'ikebukuro',
            'honancho',
        ]);
    });
    it('本線と支線に属する中野坂上を降車駅にしても本線上の位置に1回だけ表示する', () => {
        const options = getPlannerStationOptions(
            {
                fromStationId: 'ginza',
                toStationId: 'nakano-sakaue',
                rows: [{ lineId: 'marunouchi', stationId: null }],
            },
            0,
        );
        const values = options.map((option) => option.value);
        expect(values).toEqual([
            'nakano-sakaue',
            'shinjuku-sanchome',
            'yotsuya',
            'akasaka-mitsuke',
            'kokkai-gijidomae',
            'kasumigaseki',
            'otemachi',
            'awajicho',
            'korakuen',
            'ikebukuro',
        ]);
    });
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

    it.each([
        {
            fromStationId: 'tokyo',
            toStationId: 'takebashi',
            rows: [
                { lineId: 'marunouchi', stationId: 'otemachi' },
                { lineId: 'tozai', stationId: 'takebashi' },
            ],
        },
        {
            fromStationId: 'takebashi',
            toStationId: 'tokyo',
            rows: [
                { lineId: 'tozai', stationId: 'otemachi' },
                { lineId: 'marunouchi', stationId: 'tokyo' },
            ],
        },
    ] satisfies PlannerState[])('$fromStationId → $toStationId: 大手町で改札外乗換として集計する', (state) => {
        expect(buildPlannerResult(state)).toMatchObject({ outsideTransferCount: 1, insideTransferCount: 0 });
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

    it.each([
        { name: '乗車駅が未指定', fromStationId: null, toStationId: 'asakusa' },
        { name: '降車駅が未指定', fromStationId: 'inaricho', toStationId: null },
        { name: '乗車駅が存在しない', fromStationId: 'unknown', toStationId: 'asakusa' },
        { name: '降車駅が存在しない', fromStationId: 'inaricho', toStationId: 'unknown' },
        { name: '発着駅が同じ', fromStationId: 'asakusa', toStationId: 'asakusa' },
    ])('$name: 発着駅の検証で拒否する', ({ fromStationId, toStationId }) => {
        const state = {
            fromStationId,
            toStationId,
            rows: [{ lineId: 'ginza', stationId: 'asakusa' }],
        } as unknown as PlannerState;
        // 空行や乗車不能による拒否で、発着駅の検証漏れを見逃さないよう直接確認する。
        expect(getPlannerStationError(state)).not.toBeNull();
        expect(buildPlannerResult(state)).toBeNull();
    });

    it('発着駅が有効でも接続駅が未入力なら完成にしない', () => {
        expect(
            buildPlannerResult({
                fromStationId: 'inaricho',
                toStationId: 'asakusa',
                rows: [{ lineId: 'ginza', stationId: null }],
            }),
        ).toBeNull();
    });

    it('異駅名乗換で降車駅へ歩いて到達するだけでは完成にしない', () => {
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
    it('接続駅まで入力済みの乗車区間がなければ計算しない', () => {
        expect(buildPlannerPreview({ ...state, rows: [{ lineId: 'ginza', stationId: null }] })).toBeNull();
    });
    it('乗車駅に所属しない路線を指定した区間は計算しない', () => {
        expect(buildPlannerPreview({ ...state, rows: [{ lineId: 'hibiya', stationId: 'hibiya' }] })).toBeNull();
    });
});
