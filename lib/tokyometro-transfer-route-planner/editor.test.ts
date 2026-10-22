import { describe, expect, it } from 'vitest';
import { sakuradamonToAsakusaState } from '@/test/fixtures/tokyometro-transfer-route-planner';
import { createPlannerState, reversePlanner, tryChangePlannerStations, updatePlanner } from './editor';
import { buildPlannerResult, type PlannerState } from './planner';

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
        expect(completed.rows).toHaveLength(2);
        expect(buildPlannerResult(completed)).toMatchObject({ outsideTransferCount: 1 });
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
        if (!changed) throw new Error('経路を保持できませんでした');
        expect(buildPlannerResult(changed)).toMatchObject({ outsideTransferCount: 14, insideTransferCount: 4 });
        expect(sakuradamonToAsakusaState.rows.at(-1)?.stationId).toBe('asakusa');
    });
    it('既に通った三越前を新しい降車駅にすると破棄確認を必要とする', () => {
        expect(tryChangePlannerStations(sakuradamonToAsakusaState, 'sakuradamon', 'mitsukoshimae')).toBeNull();
        expect(sakuradamonToAsakusaState.toStationId).toBe('asakusa');
    });
    it('乗車駅を最初の路線上の別駅へ変更しても経路を保持する', () => {
        const changed = tryChangePlannerStations(crossRoute, 'shimbashi', 'shintomicho');
        expect(changed?.rows).toEqual(crossRoute.rows);
        if (!changed) throw new Error('経路を保持できませんでした');
        expect(buildPlannerResult(changed)?.legs[0]).toMatchObject({
            fromStationId: 'shimbashi',
            toStationId: 'ginza',
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
        if (!changed) throw new Error('経路を保持できませんでした');
        expect(buildPlannerResult(changed)).toMatchObject({ outsideTransferCount: 0, insideTransferCount: 0 });
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
        expect(changed.rows[0].stationId).toBe('ueno');
        expect(changed.rows[1]).toEqual({ lineId: 'hibiya', stationId: null });
        expect(buildPlannerResult(changed)).toBeNull();
    });
    it('途中の路線変更でその行の接続駅と後続入力を消去する', () => {
        const changed = updatePlanner(crossRoute, { type: 'line', index: 1, lineId: 'marunouchi' });
        expect(changed.rows[1]).toEqual({ lineId: 'marunouchi', stationId: null });
    });
    it('この先を削除しても指定行の入力は保持する', () => {
        const changed = updatePlanner(crossRoute, { type: 'truncate', index: 0 });
        expect(changed.rows[0]).toEqual(crossRoute.rows[0]);
        expect(changed.rows[1].stationId).toBeNull();
        expect(buildPlannerResult(changed)).toBeNull();
    });
    it('末尾の完成行だけを削除して前の区間を保持し、追加操作で入力を再開する', () => {
        const removed = updatePlanner(crossRoute, { type: 'remove-last' });
        expect(removed.rows).toEqual(crossRoute.rows.slice(0, 1));
        expect(buildPlannerResult(removed)).toBeNull();
        const resumed = updatePlanner(removed, { type: 'append' });
        expect(resumed.rows).toEqual([crossRoute.rows[0], { lineId: null, stationId: null }]);
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
    it('未入力の行が残っている場合と発着が未指定の場合は追加操作で行を増やさない', () => {
        const initial = createPlannerState('inaricho', 'iriya');
        expect(updatePlanner(initial, { type: 'append' })).toEqual(initial);
        expect(updatePlanner(createPlannerState(), { type: 'append' }).rows).toEqual([]);
    });
    it('無効化された接続駅を直接指定されても採用しない', () => {
        const state = createPlannerState('ayase', 'kita-ayase');
        expect(updatePlanner(state, { type: 'station', index: 0, stationId: 'kita-senju' })).toEqual(state);
    });
    it('大手町の乗換は路線選択時に自動決定され反転後も改札外として集計する', () => {
        let state = createPlannerState('tokyo', 'takebashi');
        state = updatePlanner(state, { type: 'station', index: 0, stationId: 'otemachi' });
        state = updatePlanner(state, { type: 'line', index: 1, lineId: 'tozai' });
        state = updatePlanner(state, { type: 'station', index: 1, stationId: 'takebashi' });
        expect(buildPlannerResult(state)).toMatchObject({ outsideTransferCount: 1, insideTransferCount: 0 });
        const reversed = reversePlanner(state);
        if (!reversed) throw new Error('完成経路の逆転に失敗しました');
        expect(buildPlannerResult(reversed)).toMatchObject({ outsideTransferCount: 1, insideTransferCount: 0 });
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
        expect(buildPlannerResult(reversed)?.fareCheckpoints[0].stationId).toBe('ginza-itchome');
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
