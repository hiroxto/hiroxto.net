import { describe, expect, it } from 'vitest';
import { sakuradamonToAsakusaState } from '@/test/fixtures/tokyometro-transfer-route-planner';
import { createPlannerState, reversePlanner, tryChangePlannerStations, updatePlanner } from './editor';
import type { PlannerState } from './planner';

const crossRoute: PlannerState = {
    fromStationId: 'kyobashi',
    toStationId: 'shintomicho',
    rows: [
        { lineId: 'ginza', stationId: 'ginza' },
        { lineId: 'yurakucho', stationId: 'shintomicho' },
    ],
};

describe('経路入力の状態遷移', () => {
    it('路線候補が1つなら自動入力し接続駅は空欄にする', () => {
        expect(createPlannerState('inaricho', 'iriya').rows).toEqual([{ lineId: 'ginza', stationId: null }]);
    });
    it('接続駅入力後は次行を追加し路線候補が1つなら自動入力する', () => {
        const state = updatePlanner(createPlannerState('inaricho', 'iriya'), {
            type: 'station',
            index: 0,
            stationId: 'ueno',
        });
        expect(state.rows).toEqual([
            { lineId: 'ginza', stationId: 'ueno' },
            { lineId: 'hibiya', stationId: null },
        ]);
        const completed = updatePlanner(state, { type: 'station', index: 1, stationId: 'iriya' });
        expect(completed).toEqual({
            fromStationId: 'inaricho',
            toStationId: 'iriya',
            rows: [
                { lineId: 'ginza', stationId: 'ueno' },
                { lineId: 'hibiya', stationId: 'iriya' },
            ],
        });
    });
    it('複数の路線があれば自動入力せず選択を待つ', () => {
        expect(createPlannerState('ginza', 'iriya').rows[0]).toEqual({
            lineId: null,
            stationId: null,
        });
    });
    it('構成できない発着変更は経路と元の発着駅を保持する', () => {
        const changed = updatePlanner(crossRoute, { type: 'stations', fromStationId: 'asakusa', toStationId: 'iriya' });
        expect(changed).toEqual(crossRoute);
    });
    it('浅草から田原町への変更では最後の区間だけを調整して提示経路を保持する', () => {
        const changed = tryChangePlannerStations(sakuradamonToAsakusaState, 'sakuradamon', 'tawaramachi');
        expect(changed?.rows).toHaveLength(19);
        expect(changed?.rows.slice(0, -1)).toEqual(sakuradamonToAsakusaState.rows.slice(0, -1));
        expect(changed?.rows.at(-1)).toEqual({ lineId: 'ginza', stationId: 'tawaramachi' });
        expect(changed).toMatchObject({ fromStationId: 'sakuradamon', toStationId: 'tawaramachi' });
        expect(sakuradamonToAsakusaState.rows.at(-1)?.stationId).toBe('asakusa');
    });
    it('既に通った三越前を新しい降車駅にすると破棄確認を必要とする', () => {
        expect(tryChangePlannerStations(sakuradamonToAsakusaState, 'sakuradamon', 'mitsukoshimae')).toBeNull();
        expect(sakuradamonToAsakusaState.toStationId).toBe('asakusa');
    });
    it('乗車駅を最初の路線上の別駅へ変更しても経路を保持する', () => {
        const changed = tryChangePlannerStations(crossRoute, 'shimbashi', 'shintomicho');
        expect(changed?.rows).toEqual(crossRoute.rows);
        expect(changed).toMatchObject({
            fromStationId: 'shimbashi',
            toStationId: 'shintomicho',
        });
    });
    it('最初の路線で乗れない駅への乗車駅変更は破棄確認を必要とする', () => {
        expect(tryChangePlannerStations(crossRoute, 'iriya', 'shintomicho')).toBeNull();
    });
    it('未完成でも選択済み路線で新しい降車駅へ続けられれば入力を保持する', () => {
        const state = updatePlanner(createPlannerState('inaricho', 'iriya'), {
            type: 'station',
            index: 0,
            stationId: 'ueno',
        });
        const changed = tryChangePlannerStations(state, 'inaricho', 'minowa');
        expect(changed?.rows).toEqual([
            { lineId: 'ginza', stationId: 'ueno' },
            { lineId: 'hibiya', stationId: null },
        ]);
    });
    it('新しい降車駅が最後の入力済み接続駅なら末尾の完全な空行を除いて完成させる', () => {
        const state = updatePlanner(createPlannerState('shimbashi', 'iriya'), {
            type: 'station',
            index: 0,
            stationId: 'ginza',
        });
        expect(state.rows.at(-1)).toEqual({ lineId: null, stationId: null });
        const changed = tryChangePlannerStations(state, 'shimbashi', 'ginza');
        expect(changed?.rows).toEqual([{ lineId: 'ginza', stationId: 'ginza' }]);
        expect(changed).toMatchObject({ fromStationId: 'shimbashi', toStationId: 'ginza' });
    });
    it('未完成経路の先で新降車駅へ到達できない場合は破棄確認を必要とする', () => {
        const state = updatePlanner(createPlannerState('inaricho', 'iriya'), {
            type: 'station',
            index: 0,
            stationId: 'ueno',
        });
        expect(tryChangePlannerStations(state, 'inaricho', 'asakusa')).toBeNull();
    });
    it('入力済み経路がなければ発着変更の破棄確認は不要', () => {
        expect(tryChangePlannerStations(createPlannerState(), 'inaricho', 'iriya')).toMatchObject({
            fromStationId: 'inaricho',
            toStationId: 'iriya',
            rows: [{ lineId: 'ginza', stationId: null }],
        });
    });
    it('途中の接続駅変更で後続入力を消去する', () => {
        const changed = updatePlanner(crossRoute, { type: 'station', index: 0, stationId: 'ueno' });
        expect(changed.rows).toEqual([
            { lineId: 'ginza', stationId: 'ueno' },
            { lineId: 'hibiya', stationId: null },
        ]);
    });
    it('途中の路線変更でその行の接続駅と後続入力を消去する', () => {
        const state: PlannerState = {
            fromStationId: 'tokyo',
            toStationId: 'asakusa',
            rows: [
                { lineId: 'marunouchi', stationId: 'otemachi' },
                { lineId: 'tozai', stationId: 'nihombashi' },
                { lineId: 'ginza', stationId: 'asakusa' },
            ],
        };
        const changed = updatePlanner(state, { type: 'line', index: 1, lineId: 'hanzomon' });
        expect(changed.rows).toEqual([
            { lineId: 'marunouchi', stationId: 'otemachi' },
            { lineId: 'hanzomon', stationId: null },
        ]);
    });
    it('この先を削除すると指定行を保持して後続入力を消去する', () => {
        const changed = updatePlanner(crossRoute, { type: 'truncate', index: 0 });
        expect(changed.rows[0]).toEqual({ lineId: 'ginza', stationId: 'ginza' });
        // 仕様では入力再開用の空行の有無を問わない。
        expect(changed.rows.slice(1).filter((row) => row.lineId != null || row.stationId != null)).toEqual([]);
    });
    it('末尾の完成行だけを削除して前の区間を保持し、追加操作で入力を再開する', () => {
        const removed = updatePlanner(crossRoute, { type: 'remove-last' });
        expect(removed.rows).toEqual(crossRoute.rows.slice(0, 1));
        expect(removed).toMatchObject({ fromStationId: 'kyobashi', toStationId: 'shintomicho' });
        const resumed = updatePlanner(removed, { type: 'append' });
        expect(resumed.rows).toEqual([crossRoute.rows[0], { lineId: null, stationId: null }]);
    });
    it('降車駅まで完成している場合は追加操作で行を増やさない', () => {
        expect(updatePlanner(crossRoute, { type: 'append' })).toEqual(crossRoute);
    });
    it('未入力の末尾行も削除でき、最後の1行を削除したら全行を消す', () => {
        const initial = createPlannerState('inaricho', 'iriya');
        const removed = updatePlanner(initial, { type: 'remove-last' });
        expect(removed.rows).toEqual([]);
        expect(updatePlanner(removed, { type: 'remove-last' })).toEqual(removed);
        expect(updatePlanner(removed, { type: 'append' })).toEqual(initial);
        const unfinished = updatePlanner(initial, { type: 'station', index: 0, stationId: 'ueno' });
        expect(updatePlanner(unfinished, { type: 'remove-last' }).rows).toEqual([
            { lineId: 'ginza', stationId: 'ueno' },
        ]);
    });
    it('発着駅が有効でも未入力の行が残っている場合は追加操作で行を増やさない', () => {
        const initial = createPlannerState('inaricho', 'iriya');
        expect(updatePlanner(initial, { type: 'append' })).toEqual(initial);
    });
    it.each([
        { name: '乗車駅が未指定', fromStationId: null, toStationId: 'shintomicho' },
        { name: '降車駅が未指定', fromStationId: 'kyobashi', toStationId: null },
    ] as const)('$name: 入力済み行の後に追加しない', ({ fromStationId, toStationId }) => {
        // 末尾行の未入力や降車駅到達では追加を抑止しない状態にする。
        const state: PlannerState = {
            fromStationId,
            toStationId,
            rows: [{ lineId: 'ginza', stationId: 'ginza' }],
        };
        expect(updatePlanner(state, { type: 'append' })).toEqual(state);
    });
    it('無効化された接続駅を直接指定されても採用しない', () => {
        const state = createPlannerState('ayase', 'kita-ayase');
        expect(updatePlanner(state, { type: 'station', index: 0, stationId: 'kita-senju' })).toEqual(state);
    });
    it('完成経路は異駅名乗換も反転し再反転で元へ戻る', () => {
        const reversed = reversePlanner(crossRoute);
        expect(reversed).toEqual({
            fromStationId: 'shintomicho',
            toStationId: 'kyobashi',
            rows: [
                { lineId: 'yurakucho', stationId: 'ginza-itchome' },
                { lineId: 'ginza', stationId: 'kyobashi' },
            ],
        });
        if (!reversed) throw new Error('完成経路の逆転に失敗しました');
        expect(reversePlanner(reversed)).toEqual(crossRoute);
    });
    it('自動入力しかない未完成経路も逆転確認を必要とする', () => {
        const state = createPlannerState('inaricho', 'iriya');
        expect(reversePlanner(state)).toBeNull();
        expect(state.fromStationId).toBe('inaricho');
        expect(state.rows[0].lineId).toBe('ginza');
    });
    it('経路が空なら確認なしの発着逆転が可能', () => {
        expect(reversePlanner({ fromStationId: 'ginza', toStationId: 'otemachi', rows: [] })).toMatchObject({
            fromStationId: 'otemachi',
            toStationId: 'ginza',
        });
    });
});
