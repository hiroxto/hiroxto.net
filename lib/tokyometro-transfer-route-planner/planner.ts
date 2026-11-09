/**
 * 東京メトロ 改札外乗換経路作成の仕様。
 *
 * 対象の駅・路線・乗換接続はlib/tokyometro-coreの共通データを使う。異なる発着駅を指定する。
 * 発着駅のIDが同じ場合や、発着駅が異駅名乗換の両端に当たる場合は、同一駅として検証エラーにする。
 * 通過駅を含め駅の再訪は禁止。同駅乗換は再訪と数えず、異駅名乗換は両駅を訪問済みにする。
 * 乗車と乗換を交互に接続し、最初と最後は乗車する。徒歩乗換の連続は認めない。
 * 同一路線の再利用は認める。改札外乗換が0回の経路や、乗換を一度も行わない経路も、乗車区間が降車駅に達すれば完成とする。
 *
 * 各行は路線と接続駅を持つ。接続駅は乗車区間の終点で、候補は乗換可能駅と降車駅。
 * 接続駅候補は乗車方向によらず駅番号順（LINE_PATHSの駅順）に並べる。丸ノ内線は本線の後に支線を並べ、
 * 両方に属する中野坂上は本線上の位置で1回だけ表示する。無効候補の表示・非表示でも順序は変えない。
 * 最初の行には発駅の所属路線を表示する。以降の行には、前の行の接続駅から乗換可能な路線を表示する。
 * 路線候補を表示する段階では、降車駅まで経路を完成できるかは検証しない。
 * 接続駅の候補は、入力済みの通過駅と乗換を考慮し、降車駅まで経路を完成できない場合に選択不可とする。
 * フォームの詳細指定に「利用不可能な駅を非表示にする」を置き、既定でONにする。
 * ONでは選択不可能な接続駅を非表示にし、OFFでは理由とともに無効な候補として表示する。
 * この設定は候補表示だけを変え、発着駅・入力済み経路は変更しない。探索打ち切りを到達不能と判定してはならない。
 * 乗換直後には1駅以上乗車するため、異駅名乗換で降車駅へ歩いて到達するだけでは完成しない。
 *
 * 路線候補が1つなら自動入力し、複数なら選択する。接続駅は自動入力しない。
 * 降車駅以外を接続駅に選んだときに次の行を追加する。
 * 行間に乗換前後の駅名と改札内・外を表示する。同駅は駅名を1つ表示する。
 * 乗換種別は入力せず、駅・路線から自動決定する。両種別が利用できる場合は改札外として扱う。
 *
 * 発着駅の検索文字を入力している間は、確定済みの発着駅と経路を変更しない。
 * 駅の選択を確定したときに、入力済みの経路を保持できるか検証する。
 * 完成済み経路は路線と途中の接続駅を維持し、最後の接続駅を新しい降車駅に差し替えて全経路を検証する。
 * 未完成経路は指定済み区間・選択済み路線を維持して新しい降車駅まで完成できるかを検証する。
 * 末尾の行で路線も接続駅も未入力なら、その行は保持できるかの判定に含めない。
 * 最後に入力済みの接続駅が新しい降車駅なら、その区間で完成とする。
 * 経路を保持できない場合は、破棄して発着駅を変更するか確認する。承諾したときだけ、経路の破棄と発着駅の変更を行う。
 * 路線の変更はその行の接続駅と後続行を、接続駅の変更は後続行を確認なしで消去する。
 * 乗換種別を変更する操作は設けない。
 * 途中行の「この先を削除」は指定行を保持し、後続行を削除する。入力再開用の空行は表示してよい。
 * 末尾行は「削除」とし、その行だけを削除する。未入力行も削除でき、最後の1行を消したら行は0件とする。
 * 末尾削除後は空行を自動追加せず、降車駅に未到達で未入力行がなければ「経路を追加」で再開する。
 * 行を追加するときも、通常の入力と同様に、路線候補が1つの場合だけ自動入力する。行の削除・追加では発着駅を変更しない。
 * 経路が完成した状態で乗車駅と降車駅を入れ替えると、乗車区間と乗換の順序・方向を反転し、運賃を再計算する。
 * 未完成で路線または接続駅の入力がある場合（自動入力も含む）は、
 * 「経路が完成していないため逆転できません。経路を破棄して乗車駅と降車駅を入れ替えますか？」
 * と確認する。承諾したときだけ、経路を破棄して乗車駅と降車駅を入れ替える。経路が未入力なら確認なしで入れ替える。
 *
 * 接続駅まで入力済みの乗車区間が1つ以上連続していれば、最後の接続駅までの乗換回数とIC・きっぷの運賃を表示する。
 * 計算区間の末端が発駅と同一駅の場合は、運賃を計算・表示しない。
 * 末尾の未入力行と路線のみ選択された行は、その直前の乗換も含めて計算対象外とする。
 * 計算した区間を「浅草 → 日比谷」のように完成時も表示する。未完成時の見出しは「作成結果 (入力途中)」とし、
 * 「入力途中」を赤文字で強調する。降車駅に到達したら見出しを「作成結果」にする。
 * lib/tokyometro-coreの共通運賃計算で、発駅から計算区間の末端までと、発駅から各改札外出場駅までの運賃を求める。
 * IC・きっぷそれぞれの最大値を採用する。異駅名乗換では出場側の駅を使い、運賃計算距離は実乗車距離と区別する。
 * 計算可能な乗車区間がなければ「経路を入力してください」と表示する。デバッグ情報は閉じたアコーディオンに置き、
 * 表示した計算区間の実乗車距離・最短運賃計算距離・各改札外出場駅の運賃だけを表示する。入力状態やJSONは表示しない。
 * 出場駅ごとの運賃は「改札外乗換 1 (有楽町) : 1.0km / IC 178円 / きっぷ 180円」の書式で表示する。
 * 利用日・途中行の単体削除・保存・URL共有・再読込による復元は設けない。
 */
import { LINE_DEFINITIONS, LINE_PATHS, type LineId, STATION_NAMES, type StationId } from '@/lib/tokyometro-core/data';
import { calculateRouteFare } from '@/lib/tokyometro-core/fare';
import { getRideSegments, getTransfers } from '@/lib/tokyometro-core/routing';
import { isSameStation, stationIdSchema, stations } from '@/lib/tokyometro-core/stations';
import type { RouteLeg, RouteResult, RouteTransfer } from '@/lib/tokyometro-core/types';

/** 経路作成用の乗車区間。開始駅を除く通過駅を乗車順に保持する。 */
export type PlannerRideSegment = RouteLeg & { stationIds: StationId[] };

/**
 * 降車駅より先の駅も選択不可の候補として表示できるよう、接続駅の列挙は降車駅を越えて続ける。
 * 呼出側が共有キャッシュを変更しないよう、配列と区間を複製する。
 */
export const getRoutePlannerSegments = (
    fromStationId: StationId,
    lineId: LineId,
    destinationStationId: StationId,
): PlannerRideSegment[] =>
    getRideSegments(fromStationId, lineId, destinationStationId, false).map((segment) => ({
        fromStationId: segment.fromStationId,
        toStationId: segment.toStationId,
        lineId: segment.lineId,
        distanceTenths: segment.distanceTenths,
        stationIds: segment.rideSteps.map((step) => step.toStationId),
    }));

/** 改札外を先にし、乗換前後の駅・路線・種別を方向付きで返す。 */
export const getRoutePlannerTransfers = (stationId: StationId, lineId: LineId): RouteTransfer[] =>
    getTransfers(stationId, lineId).map(({ kind: _kind, ...transfer }) => transfer);

export type PlannerRow = { lineId: LineId | null; stationId: StationId | null };
export type PlannerState = { fromStationId: StationId | null; toStationId: StationId | null; rows: PlannerRow[] };
export type PlannerOption = { value: string; label: string; disabled: boolean; reason?: string };
type Prefix = { stationId: StationId; visited: Set<StationId>; legs: PlannerRideSegment[]; transfers: RouteTransfer[] };

/** 画面の選択に加え、経路生成の境界でも発着駅を検証する。 */
export const getPlannerStationError = (state: PlannerState): string | null => {
    if (
        !stationIdSchema.safeParse(state.fromStationId).success ||
        !stationIdSchema.safeParse(state.toStationId).success
    ) {
        return '選択肢から乗車駅と降車駅を指定してください';
    }
    return isSameStation(state.fromStationId, state.toStationId)
        ? '乗車駅と降車駅には異なる駅を指定してください'
        : null;
};

const canRide = (segment: PlannerRideSegment, visited: Set<StationId>, destination: StationId): boolean =>
    !segment.stationIds.some((id) => visited.has(id)) && !segment.stationIds.slice(0, -1).includes(destination);
const canTransfer = (transfer: RouteTransfer, visited: Set<StationId>, destination: StationId): boolean =>
    transfer.toStationId === transfer.fromStationId ||
    (!visited.has(transfer.toStationId) && transfer.toStationId !== destination);
const addTransfer = (prefix: Prefix, transfer: RouteTransfer): Prefix => ({
    ...prefix,
    stationId: transfer.toStationId,
    visited: new Set([...prefix.visited, transfer.toStationId]),
    transfers: [...prefix.transfers, transfer],
});
const addRide = (prefix: Prefix, segment: PlannerRideSegment): Prefix => ({
    ...prefix,
    stationId: segment.toStationId,
    visited: new Set([...prefix.visited, ...segment.stationIds]),
    legs: [...prefix.legs, segment],
});

/** indexより前の入力済み乗車区間を検証する。完成可能性はここでは判定しない。 */
const readPrefix = (state: PlannerState, index: number): Prefix | null => {
    if (getPlannerStationError(state) || state.fromStationId == null || state.toStationId == null) return null;
    let prefix: Prefix = {
        stationId: state.fromStationId,
        visited: new Set([state.fromStationId]),
        legs: [],
        transfers: [],
    };
    for (let i = 0; i < index; i++) {
        const row = state.rows[i];
        if (row?.lineId == null || row.stationId == null || prefix.stationId === state.toStationId) return null;
        if (i > 0) {
            const previousLine = state.rows[i - 1].lineId;
            if (previousLine == null) return null;
            const transfer = getRoutePlannerTransfers(prefix.stationId, previousLine).find(
                (candidate) => candidate.toLineId === row.lineId,
            );
            if (!transfer || !canTransfer(transfer, prefix.visited, state.toStationId)) return null;
            prefix = addTransfer(prefix, transfer);
        } else if (!stations.find((station) => station.id === prefix.stationId)?.lineIds.includes(row.lineId)) {
            return null;
        }
        const segment = getRoutePlannerSegments(prefix.stationId, row.lineId, state.toStationId).find(
            (candidate) => candidate.toStationId === row.stationId,
        );
        if (!segment || !canRide(segment, prefix.visited, state.toStationId)) return null;
        prefix = addRide(prefix, segment);
    }
    return prefix;
};

/** 行の直前の乗換候補。路線の完成可能性を判定せず、利用可能な接続を列挙する。 */
export const getPlannerIncomingTransfers = (state: PlannerState, index: number): RouteTransfer[] => {
    if (index <= 0) return [];
    const prefix = readPrefix(state, index);
    const lineId = state.rows[index - 1]?.lineId;
    if (!prefix || !lineId || prefix.stationId === state.toStationId) return [];
    return getRoutePlannerTransfers(prefix.stationId, lineId);
};
export const getPlannerLineOptions = (state: PlannerState, index: number): PlannerOption[] => {
    if (getPlannerStationError(state)) return [];
    const lineIds =
        index === 0
            ? (stations.find((station) => station.id === state.fromStationId)?.lineIds ?? [])
            : [...new Set(getPlannerIncomingTransfers(state, index).map((transfer) => transfer.toLineId))];
    return lineIds.map((value) => ({ value, label: LINE_DEFINITIONS[value].name, disabled: false }));
};
/** 駅と路線から乗換を自動決定する。両種別が使える場合は既存定義の改札外優先順を使う。 */
export const getPlannerIncomingTransfer = (state: PlannerState, index: number): RouteTransfer | null => {
    const row = state.rows[index];
    return getPlannerIncomingTransfers(state, index).find((transfer) => transfer.toLineId === row?.lineId) ?? null;
};

/**
 * 入力済みの駅を除き、乗車と乗換を交互にたどって降車駅に到達できるかを幅優先で調べる。
 * 未入力の区間同士では同じ駅を通ることを許すため、この判定は到達できない候補の除外にだけ使う。
 * 徒歩乗換だけで降車駅に着く経路や、徒歩乗換が連続する経路も除外し、後続の探索で不要な迂回を調べずに済むようにする。
 */
const isConnected = (from: StationId, lineId: LineId, destination: StationId, visited: Set<StationId>): boolean => {
    const queue = [{ stationId: from, lineId }];
    const seen = new Set<string>([`${from}:${lineId}`]);
    for (let i = 0; i < queue.length; i++) {
        const current = queue[i];
        if (current.stationId === destination) return true;
        for (const transfer of getRoutePlannerTransfers(current.stationId, current.lineId)) {
            if (!canTransfer(transfer, visited, destination)) continue;
            const used = new Set([...visited, transfer.toStationId]);
            for (const segment of getRoutePlannerSegments(transfer.toStationId, transfer.toLineId, destination)) {
                if (!canRide(segment, used, destination)) continue;
                if (segment.toStationId === destination) return true;
                const key = `${segment.toStationId}:${segment.lineId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    queue.push({ stationId: segment.toStationId, lineId: segment.lineId });
                }
            }
        }
    }
    return false;
};

/**
 * 乗車区間の終点から、降車駅まで経路を完成できるか調べる。各乗換の後に必ず乗車し、訪問済みの駅を探索の枝ごとに保持する。
 * 幅優先の到達判定は候補の除外にだけ使う。制約を満たす経路が見つかれば、完成できると判定する。
 */
const canFinish = (stationId: StationId, lineId: LineId, visited: Set<StationId>, destination: StationId): boolean => {
    const failed = new Set<string>();
    const visit = (current: StationId, line: LineId, used: Set<StationId>): boolean => {
        if (current === destination) return true;
        if (!isConnected(current, line, destination, used)) return false;
        const key = `${current}:${line}:${[...used].sort().join(',')}`;
        if (failed.has(key)) return false;
        for (const transfer of getRoutePlannerTransfers(current, line)) {
            if (!canTransfer(transfer, used, destination)) continue;
            const nextUsed = new Set([...used, transfer.toStationId]);
            const segments = getRoutePlannerSegments(transfer.toStationId, transfer.toLineId, destination).filter(
                (segment) => canRide(segment, nextUsed, destination),
            );
            if (segments.some((segment) => segment.toStationId === destination)) return true;
            for (const segment of segments) {
                if (visit(segment.toStationId, transfer.toLineId, new Set([...nextUsed, ...segment.stationIds])))
                    return true;
            }
        }
        failed.add(key);
        return false;
    };
    return visit(stationId, lineId, visited);
};

export const getPlannerStationOptions = (state: PlannerState, index: number): PlannerOption[] => {
    let prefix = readPrefix(state, index);
    const row = state.rows[index];
    const destination = state.toStationId;
    if (!prefix || !row?.lineId || !destination) return [];
    if (!getPlannerLineOptions(state, index).some((option) => option.value === row.lineId)) return [];
    let transferInvalid = false;
    if (index > 0) {
        const transfer = getPlannerIncomingTransfer(state, index);
        if (!transfer) return [];
        transferInvalid = !canTransfer(transfer, prefix.visited, destination);
        prefix = addTransfer(prefix, transfer);
    }
    const context = prefix;
    const stationOrder = LINE_PATHS.filter((path) => path.lineId === row.lineId).flatMap((path) =>
        path.stations.map(([stationId]) => stationId),
    );
    return getRoutePlannerSegments(context.stationId, row.lineId, destination)
        .map((segment) => {
            let reason: string | undefined;
            if (transferInvalid || segment.stationIds.some((id) => context.visited.has(id))) {
                reason = '訪問済みの駅を通るため選択できません';
            } else if (segment.stationIds.slice(0, -1).includes(destination)) {
                reason = '降車駅を通り越すため選択できません';
            } else if (
                !canFinish(
                    segment.toStationId,
                    segment.lineId,
                    new Set([...context.visited, ...segment.stationIds]),
                    destination,
                )
            ) {
                reason = 'この接続駅から降車駅まで経路を構成できません';
            }
            return {
                value: segment.toStationId,
                label: STATION_NAMES[segment.toStationId],
                disabled: reason != null,
                reason,
            };
        })
        .sort((a, b) => stationOrder.indexOf(a.value as StationId) - stationOrder.indexOf(b.value as StationId));
};

export const buildPlannerResult = (state: PlannerState): RouteResult | null => {
    const from = state.fromStationId;
    const to = state.toStationId;
    if (!from || !to || state.rows.length === 0) return null;
    const prefix = readPrefix(state, state.rows.length);
    if (!prefix || prefix.stationId !== to) return null;
    return calculatePrefixResult(state, prefix);
};

/** 完成判定とは独立して、入力済みの乗車区間だけを計算する。 */
export const buildPlannerPreview = (
    state: PlannerState,
): {
    result: RouteResult;
    fromStationId: StationId;
    toStationId: StationId;
    complete: boolean;
} | null => {
    const incompleteIndex = state.rows.findIndex((row) => row.lineId == null || row.stationId == null);
    const count = incompleteIndex < 0 ? state.rows.length : incompleteIndex;
    if (count === 0 || !state.fromStationId) return null;
    const prefix = readPrefix(state, count);
    if (!prefix || isSameStation(state.fromStationId, prefix.stationId)) return null;
    return {
        result: calculatePrefixResult({ ...state, rows: state.rows.slice(0, count) }, prefix),
        fromStationId: state.fromStationId,
        toStationId: prefix.stationId,
        complete: count === state.rows.length && prefix.stationId === state.toStationId,
    };
};

const calculatePrefixResult = (state: PlannerState, prefix: Prefix): RouteResult => {
    const from = prefix.legs[0].fromStationId;
    const to = prefix.stationId;
    const outside = prefix.transfers.filter((transfer) => transfer.type === 'outside');
    return {
        key: state.rows.map((row) => `${row.lineId}:${row.stationId}`).join('|'),
        legs: prefix.legs.map(({ stationIds: _stationIds, ...leg }) => leg),
        transfers: prefix.transfers,
        outsideTransferCount: outside.length,
        insideTransferCount: prefix.transfers.length - outside.length,
        actualDistanceTenths: prefix.legs.reduce((distance, leg) => distance + leg.distanceTenths, 0),
        ...calculateRouteFare(from, to, prefix.transfers),
    };
};
