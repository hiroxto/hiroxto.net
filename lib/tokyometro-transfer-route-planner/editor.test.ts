import { describe, expect, it } from 'vitest';
import { createPlannerState, reversePlanner, updatePlanner } from './editor';
import { buildPlannerResult, type PlannerState } from './planner';

const crossRoute: PlannerState = {
    fromStationId: 'kyobashi',
    toStationId: 'shintomicho',
    rows: [
        { lineId: 'ginza', stationId: 'ginza', transferType: null },
        { lineId: 'yurakucho', stationId: 'shintomicho', transferType: 'outside' },
    ],
};

describe('経路入力の状態遷移', () => {
    it('路線候補が1つなら自動入力し接続駅は空欄にする', () => {
        expect(createPlannerState('inaricho', 'iriya').rows).toEqual([
            { lineId: 'ginza', stationId: null, transferType: null },
        ]);
    });
    it('接続駅入力後は次行を追加し路線候補が1つなら自動入力する', () => {
        const state = updatePlanner(createPlannerState('inaricho', 'iriya'), {
            type: 'station',
            index: 0,
            stationId: 'ueno',
        });
        expect(state.rows).toEqual([
            { lineId: 'ginza', stationId: 'ueno', transferType: null },
            { lineId: 'hibiya', stationId: null, transferType: 'outside' },
        ]);
        const completed = updatePlanner(state, { type: 'station', index: 1, stationId: 'iriya' });
        expect(completed.rows).toHaveLength(2);
        expect(buildPlannerResult(completed)).toMatchObject({ outsideTransferCount: 1 });
    });
    it('複数の路線があれば自動入力せず選択を待つ', () => {
        expect(createPlannerState('ginza', 'iriya').rows[0]).toEqual({
            lineId: null,
            stationId: null,
            transferType: null,
        });
    });
    it('発着駅変更で全経路を消去し新しい路線候補を適用する', () => {
        const changed = updatePlanner(crossRoute, { type: 'stations', fromStationId: 'asakusa', toStationId: 'iriya' });
        expect(changed.rows).toEqual([{ lineId: 'ginza', stationId: null, transferType: null }]);
    });
    it('途中の接続駅変更で後続入力を消去する', () => {
        const changed = updatePlanner(crossRoute, { type: 'station', index: 0, stationId: 'ueno' });
        expect(changed.rows[0].stationId).toBe('ueno');
        expect(changed.rows[1]).toEqual({ lineId: 'hibiya', stationId: null, transferType: 'outside' });
        expect(buildPlannerResult(changed)).toBeNull();
    });
    it('途中の路線変更でその行の接続駅と後続入力を消去する', () => {
        const changed = updatePlanner(crossRoute, { type: 'line', index: 1, lineId: 'marunouchi' });
        expect(changed.rows[1]).toEqual({ lineId: 'marunouchi', stationId: null, transferType: 'inside' });
    });
    it('この先を削除しても指定行の入力は保持する', () => {
        const changed = updatePlanner(crossRoute, { type: 'truncate', index: 0 });
        expect(changed.rows[0]).toEqual(crossRoute.rows[0]);
        expect(changed.rows[1].stationId).toBeNull();
        expect(buildPlannerResult(changed)).toBeNull();
    });
    it('無効化された接続駅を直接指定されても採用しない', () => {
        const state = createPlannerState('ayase', 'kita-ayase');
        expect(updatePlanner(state, { type: 'station', index: 0, stationId: 'kita-senju' })).toEqual(state);
    });
    it('大手町の乗換種別だけの変更では後続経路を保持し結果を再集計する', () => {
        const state: PlannerState = {
            fromStationId: 'tokyo',
            toStationId: 'takebashi',
            rows: [
                { lineId: 'marunouchi', stationId: 'otemachi', transferType: null },
                { lineId: 'tozai', stationId: 'takebashi', transferType: 'outside' },
            ],
        };
        const changed = updatePlanner(state, { type: 'transfer', index: 1, transferType: 'inside' });
        expect(changed.rows[1].stationId).toBe('takebashi');
        expect(buildPlannerResult(changed)).toMatchObject({ outsideTransferCount: 0, insideTransferCount: 1 });
    });
    it('完成経路は異駅名乗換も反転し再反転で元へ戻る', () => {
        const reversed = reversePlanner(crossRoute);
        expect(reversed).toEqual({
            fromStationId: 'shintomicho',
            toStationId: 'kyobashi',
            rows: [
                { lineId: 'yurakucho', stationId: 'ginza-itchome', transferType: null },
                { lineId: 'ginza', stationId: 'kyobashi', transferType: 'outside' },
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
