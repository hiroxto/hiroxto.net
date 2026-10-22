import type { LineId, StationId } from '@/lib/tokyometro-core/data';
import {
    buildPlannerResult,
    getPlannerLineOptions,
    getPlannerStationError,
    getPlannerStationOptions,
    type PlannerRow,
    type PlannerState,
} from '@/lib/tokyometro-transfer-route-planner/planner';

export type PlannerAction =
    | { type: 'stations'; fromStationId: StationId | null; toStationId: StationId | null }
    | { type: 'line'; index: number; lineId: LineId | null }
    | { type: 'station'; index: number; stationId: StationId | null }
    | { type: 'truncate'; index: number }
    | { type: 'remove-last' }
    | { type: 'append' };

const emptyRow = (): PlannerRow => ({ lineId: null, stationId: null });
/** 末尾の入力行を用意し、路線候補が単一の場合だけ自動入力する。 */
const prepareNextRow = (state: PlannerState): PlannerState => {
    if (getPlannerStationError(state)) return { ...state, rows: [] };
    const rows = [...state.rows];
    const last = rows.at(-1);
    if (last?.stationId === state.toStationId) return state;
    if (!last || last.stationId != null) rows.push(emptyRow());
    const next = { ...state, rows };
    const index = rows.length - 1;
    if (rows[index].lineId == null) {
        const options = getPlannerLineOptions(next, index);
        if (options.length === 1) rows[index] = { ...rows[index], lineId: options[0].value as LineId };
    }
    return next;
};

export const createPlannerState = (
    fromStationId: StationId | null = null,
    toStationId: StationId | null = null,
): PlannerState => prepareNextRow({ fromStationId, toStationId, rows: [] });

/** 入力済み経路を保持できる発着変更だけを返す。nullなら元の入力を残して破棄確認する。 */
export const tryChangePlannerStations = (
    state: PlannerState,
    fromStationId: StationId | null,
    toStationId: StationId | null,
): PlannerState | null => {
    if (fromStationId === state.fromStationId && toStationId === state.toStationId) return state;
    if (!state.rows.some((row) => row.lineId != null || row.stationId != null)) {
        return createPlannerState(fromStationId, toStationId);
    }
    const rows = [...state.rows];
    while (rows.length > 0 && rows.at(-1)?.lineId == null && rows.at(-1)?.stationId == null) rows.pop();
    const candidate: PlannerState = { ...state, fromStationId, toStationId, rows };
    if (getPlannerStationError(candidate)) return null;
    if (buildPlannerResult(state)) {
        const lastIndex = candidate.rows.length - 1;
        candidate.rows[lastIndex] = { ...candidate.rows[lastIndex], stationId: toStationId };
        return buildPlannerResult(candidate) ? candidate : null;
    }
    const prepared = prepareNextRow(candidate);
    if (buildPlannerResult(prepared)) return prepared;
    const index = prepared.rows.length - 1;
    const last = prepared.rows[index];
    if (!last || last.stationId != null) return null;
    const lineIds = last.lineId
        ? [last.lineId]
        : getPlannerLineOptions(prepared, index).map((option) => option.value as LineId);
    const canComplete = lineIds.some((lineId) => {
        const withLine = { ...prepared, rows: [...prepared.rows.slice(0, index), { ...last, lineId }] };
        return getPlannerStationOptions(withLine, index).some((option) => !option.disabled);
    });
    return canComplete ? prepared : null;
};

export const updatePlanner = (state: PlannerState, action: PlannerAction): PlannerState => {
    if (action.type === 'stations')
        return tryChangePlannerStations(state, action.fromStationId, action.toStationId) ?? state;
    if (action.type === 'remove-last') return { ...state, rows: state.rows.slice(0, -1) };
    if (action.type === 'append') {
        const last = state.rows.at(-1);
        if (getPlannerStationError(state) || (last && (last.stationId == null || last.stationId === state.toStationId)))
            return state;
        return prepareNextRow(state);
    }
    const row = state.rows[action.index];
    if (!row) return state;
    if (action.type === 'line') {
        if (row.lineId === action.lineId) return state;
        if (
            action.lineId != null &&
            !getPlannerLineOptions(state, action.index).some((option) => option.value === action.lineId)
        )
            return state;
        const rows = state.rows.slice(0, action.index);
        rows.push({ lineId: action.lineId, stationId: null });
        return prepareNextRow({ ...state, rows });
    }
    if (action.type === 'station') {
        if (row.stationId === action.stationId) return state;
        if (
            action.stationId != null &&
            !getPlannerStationOptions(state, action.index).some(
                (option) => option.value === action.stationId && !option.disabled,
            )
        )
            return state;
        return prepareNextRow({
            ...state,
            rows: [...state.rows.slice(0, action.index), { ...row, stationId: action.stationId }],
        });
    }
    return prepareNextRow({ ...state, rows: state.rows.slice(0, action.index + 1) });
};

/** nullの場合は未完成入力の破棄確認が必要。呼出側は承諾まで元の状態を保持する。 */
export const reversePlanner = (state: PlannerState): PlannerState | null => {
    const result = buildPlannerResult(state);
    if (result) {
        const reversed: PlannerState = {
            fromStationId: state.toStationId,
            toStationId: state.fromStationId,
            rows: [...result.legs].reverse().map((leg) => ({
                lineId: leg.lineId,
                stationId: leg.fromStationId,
            })),
        };
        return buildPlannerResult(reversed) ? reversed : null;
    }
    if (state.rows.some((row) => row.lineId != null || row.stationId != null)) return null;
    return createPlannerState(state.toStationId, state.fromStationId);
};
