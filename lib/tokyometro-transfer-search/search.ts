/**
 * 東京メトロ 改札外乗換検索のアルゴリズム。
 *
 * 対象は、異なる発着駅を結び、改札外乗換を1回以上含む駅の再訪がない経路。
 * 乗車区間と乗換を交互に接続し、最初と最後は必ず乗車する。乗換だけの連続移動は扱わない。
 * 同駅での乗換は駅の再訪に数えず、異駅名の乗換では両方の駅を訪問済みにする。
 * 同じ路線の再利用は認める。指定する回数上限は改札外乗換だけに適用する。
 * 距離はすべて0.1km単位の整数で扱い、徒歩乗換の距離は加算しない。
 *
 * 1. 路線データから駅間のグラフと路線別のグラフを作る。
 *    訪問済みの駅はbigintのビットマスク（各ビットが1駅を表す集合）で管理する。
 *    改札外乗換地点は同駅なら駅ごと、異駅名なら接続定義ごとに1ビットを割り当てる。
 *    こちらはnumberのビット演算を使うため、地点数を30以下に制限する。
 * 2. 発着駅を含む改札外乗換地点を除外する。さらに、反対側の端点を通らずに
 *    発駅・着駅の双方から到達できる地点だけを残し、探索回数の上限を求める。
 *    この到達判定は路線を区別しない必要条件であり、経路の存在を保証しない。
 * 3. 改札外乗換1回から上限まで順に候補を探す。各回数について、その個数の
 *    改札外乗換地点の組合せを列挙し、組合せに含む地点をすべて使う経路を深さ優先で探索する。
 *    同一路線で乗り続ける区間は、乗換駅または着駅までをMacroSegmentにまとめて扱う。
 *    駅の再訪、必須地点の通過による乗換機会の喪失、残りの必須駅への到達不能を除外する。
 *    各回数の候補探索は最初の1件で終了し、それまでに見つけた最大回数の候補を保持する。
 * 4. 残りの予算で、発見済みの最大回数について改めて探索し、上位20件を保持する。
 *    比較順は改札外乗換の多い順、改札内乗換の少ない順、実乗車距離の短い順、経路キー順。
 *    最大回数の候補だけを返し、20件未満でも少ない回数の経路で補充しない。
 *    20件そろった後は、改札内乗換数と着駅までの最短実距離を使い、順位を改善できない枝を除く。
 * 5. 探索は既定で合計500万訪問・5秒を目安に制限する。訪問数は主探索の再帰呼出しを数える。
 *    各回数の候補探索には残り時間の1/4、残り訪問数の1/4を目安に配分する。
 *    訪問数の配分は最低1万・最大12万5000を目安とし、全体の残り訪問数を超えない。
 *    時間は各探索の初回と以後1000訪問ごとに確認するため、厳密な実行時間の上限ではない。
 *    前処理も時間予算に含むが、前処理中には期限を確認しない。
 * 6. 未探索部分が結果に影響し得る場合はtruncatedをtrueにする。
 *    outsideTransferUpperBoundは未探索部分を含む最大回数の上限を表す。
 *    候補の回数がこの上限に一致すれば最大回数は確定するが、順位は未確定の場合がある。
 *    候補が空でもtruncatedがtrueなら、経路が存在しないとは確定していない。
 *
 * グラフと各キャッシュはモジュール内で共有する。同じモジュールでの次回検索にも計算結果を使う。
 *
 * 運賃は経路探索と分けて求める。ダイクストラ法で発駅から各駅への最短運賃計算距離を計算し、
 * 距離帯別運賃と特定区間の運賃を適用する。経路の運賃は、着駅と各改札外出場駅までの
 * 運賃の最大値をIC・きっぷ別に採用する。探索時の実乗車距離と運賃計算距離は区別する。
 */

import { createMinHeap } from '@/lib/tokyometro-transfer-search/min-heap';

import {
    CROSS_STATION_TRANSFERS,
    FARE_CALCULATION_DISTANCE_OVERRIDES,
    LINE_DEFINITIONS,
    LINE_PATHS,
    type LineId,
    SAME_STATION_INSIDE_AND_OUTSIDE_TRANSFERS,
    SAME_STATION_OUTSIDE_TRANSFERS,
    STATION_NAMES,
    type StationId,
    type TransferType,
} from './data';

/** 全路線のグラフに登録する、隣接駅への乗車接続。 */
type RideEdge = {
    /** 乗車と乗換を区別する処理種別。 */
    kind: 'ride';
    /** 移動先の駅ID。 */
    stationId: StationId;
    /** 乗車する路線。 */
    lineId: LineId;
    /** 乗車距離。単位は0.1km。 */
    distanceTenths: number;
};

/** 全路線のグラフに登録する、異駅名間の徒歩乗換接続。 */
type CrossTransferEdge = {
    /** 乗車と乗換を区別する処理種別。 */
    kind: 'transfer';
    /** 移動先の駅ID。 */
    stationId: StationId;
    /** 乗換前の路線。 */
    fromLineId: LineId;
    /** 乗換後の路線。 */
    toLineId: LineId;
    /** 改札内・改札外の乗換種別。 */
    type: TransferType;
};

/** 駅間の接続。同駅の乗換は駅を移動しないため、このグラフには含めない。 */
type GraphEdge = RideEdge | CrossTransferEdge;

/** 路線別のグラフで使う隣接駅と実乗車距離。 */
type LineRideEdge = {
    /** 移動先の駅ID。 */
    stationId: StationId;
    /** 乗車距離。単位は0.1km。 */
    distanceTenths: number;
};

/** 経路を構成する、隣接駅間の1回の乗車。 */
type RideStep = {
    /** 乗車と乗換を区別する処理種別。 */
    kind: 'ride';
    /** 区間または乗換の開始駅。 */
    fromStationId: StationId;
    /** 区間または乗換の終了駅。 */
    toStationId: StationId;
    /** 乗車する路線。 */
    lineId: LineId;
    /** 乗車距離。単位は0.1km。 */
    distanceTenths: number;
};

/** 経路を構成する、同駅または異駅名間の1回の乗換。 */
type TransferStep = {
    /** 乗車と乗換を区別する処理種別。 */
    kind: 'transfer';
    /** 区間または乗換の開始駅。 */
    fromStationId: StationId;
    /** 区間または乗換の終了駅。 */
    toStationId: StationId;
    /** 乗換前の路線。 */
    fromLineId: LineId;
    /** 乗換後の路線。 */
    toLineId: LineId;
    /** 改札内・改札外の乗換種別。 */
    type: TransferType;
};

/** 経路順に並べる乗車または乗換の記録。 */
type TraversalStep = RideStep | TransferStep;

/** 乗換までの連続した乗車をまとめた表示用区間。 */
export type RouteLeg = {
    /** 区間または乗換の開始駅。 */
    fromStationId: StationId;
    /** 区間または乗換の終了駅。 */
    toStationId: StationId;
    /** 乗車する路線。 */
    lineId: LineId;
    /** 乗車距離。単位は0.1km。 */
    distanceTenths: number;
};

/** 表示用の乗換情報。処理種別のkindを除いた乗換記録。 */
export type RouteTransfer = Omit<TransferStep, 'kind'>;

/** ICカードときっぷの運賃。単位は円。 */
export type Fare = {
    /** ICカードの運賃。単位は円。 */
    ic: number;
    /** きっぷの運賃。単位は円。 */
    ticket: number;
};

/** 改札外に出場する駅までの最短運賃計算距離と運賃。 */
export type FareCheckpoint = {
    /** 改札外に出場する駅のID。 */
    stationId: StationId;
    /** 発駅から対象駅までの最短運賃計算距離。単位は0.1km。 */
    shortestDistanceTenths: number;
    /** IC・きっぷ別の運賃。 */
    fare: Fare;
};

/** 1経路の表示情報、乗換回数、距離、運賃。 */
export type RouteResult = {
    /** 乗車・乗換の順序と方向を含む経路識別子。同順位の比較にも使う。 */
    key: string;
    /** 乗換で区切った、経路順の乗車区間。 */
    legs: RouteLeg[];
    /** 経路順の乗換一覧。 */
    transfers: RouteTransfer[];
    /** 改札外乗換の回数。 */
    outsideTransferCount: number;
    /** 改札内乗換の回数。 */
    insideTransferCount: number;
    /** 経路全体の実乗車距離。徒歩距離を除く0.1km単位。 */
    actualDistanceTenths: number;
    /** 発駅から対象駅までの最短運賃計算距離。単位は0.1km。 */
    shortestDistanceTenths: number;
    /** IC・きっぷ別の運賃。 */
    fare: Fare;
    /** 改札外出場ごとの運賃確認結果。 */
    fareCheckpoints: FareCheckpoint[];
};

/** 検索候補と、探索の完了状況および最大回数の上限。 */
export type RouteSearchResult = {
    /** 発見済みの最大改札外乗換回数を持つ候補。順位順で最大20件。 */
    routes: RouteResult[];
    /** 未探索部分により最大回数または上位候補の順位が未確定ならtrue。 */
    truncated: boolean;
    /** 未探索部分を含む改札外乗換回数の上限。候補の回数と一致すれば最大回数は確定。 */
    outsideTransferUpperBound: number;
};

/** 駅選択に使う駅ID、表示名、利用可能な路線。 */
export type StationOption = {
    /** 駅選択の値に使う駅ID。 */
    id: StationId;
    /** 駅の表示名。 */
    name: string;
    /** 駅で利用できる路線ID。 */
    lineIds: LineId[];
};

/** 駅データの定義順に並べた全駅ID。 */
const stationIds = Object.keys(STATION_NAMES) as StationId[];

/** 全路線の乗車接続と異駅名の乗換接続。距離計算と到達判定に使う。 */
const graph = new Map<StationId, GraphEdge[]>(stationIds.map((stationId) => [stationId, []]));
/** 駅ごとの所属路線。発駅で選べる路線と同駅の乗換先を求める。 */
const stationLineIds = new Map<StationId, Set<LineId>>(stationIds.map((stationId) => [stationId, new Set<LineId>()]));
/** 路線ごとの乗車専用グラフ。分岐を含む同一路線の区間を列挙する。 */
const lineGraphs = new Map<LineId, Map<StationId, LineRideEdge[]>>();

for (const path of LINE_PATHS) {
    // 処理対象の路線に属する乗車接続。
    let lineGraph = lineGraphs.get(path.lineId);

    if (lineGraph == null) {
        lineGraph = new Map<StationId, LineRideEdge[]>();
        lineGraphs.set(path.lineId, lineGraph);
    }

    for (const [stationId] of path.stations) {
        stationLineIds.get(stationId)?.add(path.lineId);

        if (!lineGraph.has(stationId)) {
            lineGraph.set(stationId, []);
        }
    }

    for (let index = 1; index < path.stations.length; index += 1) {
        // 隣接区間の開始駅。
        const [fromStationId] = path.stations[index - 1];
        // 隣接区間の終了駅と、直前の駅からの実乗車距離（0.1km単位）。
        const [toStationId, distanceTenths] = path.stations[index];

        graph.get(fromStationId)?.push({
            kind: 'ride',
            stationId: toStationId,
            lineId: path.lineId,
            distanceTenths,
        });
        graph.get(toStationId)?.push({
            kind: 'ride',
            stationId: fromStationId,
            lineId: path.lineId,
            distanceTenths,
        });
        lineGraph.get(fromStationId)?.push({ stationId: toStationId, distanceTenths });
        lineGraph.get(toStationId)?.push({ stationId: fromStationId, distanceTenths });
    }
}

for (const connection of CROSS_STATION_TRANSFERS) {
    for (const [fromLineId, toLineId] of connection.linePairs) {
        graph.get(connection.fromStationId)?.push({
            kind: 'transfer',
            stationId: connection.toStationId,
            fromLineId,
            toLineId,
            type: connection.type,
        });
        graph.get(connection.toStationId)?.push({
            kind: 'transfer',
            stationId: connection.fromStationId,
            fromLineId: toLineId,
            toLineId: fromLineId,
            type: connection.type,
        });
    }
}

/** 改札外乗換が可能な同駅の路線ペア。路線IDを整列して方向を区別しない。 */
const outsideTransferKeys = new Set(
    SAME_STATION_OUTSIDE_TRANSFERS.map(([stationId, firstLineId, secondLineId]) =>
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
    ),
);

/** 改札内・改札外の両方を選択できる同駅の路線ペア。 */
const insideAndOutsideTransferKeys = new Set(
    SAME_STATION_INSIDE_AND_OUTSIDE_TRANSFERS.map(([stationId, firstLineId, secondLineId]) =>
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
    ),
);

/** 同駅の路線ペアに許可する乗換種別を返す。両方使える場合は改札外を先にする。 */
const getSameStationTransferTypes = (stationId: StationId, fromLineId: LineId, toLineId: LineId): TransferType[] => {
    // 方向を区別しない駅・路線ペアの照合キー。
    const key = [stationId, ...[fromLineId, toLineId].sort()].join(':');
    if (insideAndOutsideTransferKeys.has(key)) return ['outside', 'inside'];
    return outsideTransferKeys.has(key) ? ['outside'] : ['inside'];
};

/** 各駅に割り当てたbigintの1ビット。駅数が32以上でも訪問履歴を保持する。 */
const stationBits = new Map(stationIds.map((stationId, index) => [stationId, BigInt(1) << BigInt(index)]));

/** 駅IDに対応するビットを返す。未登録の駅IDはエラーにする。 */
const getStationBit = (stationId: StationId): bigint => {
    // 対象駅に割り当てた1ビット。
    const bit = stationBits.get(stationId);

    if (bit == null) {
        throw new Error(`駅のビット値が見つかりません: ${stationId}`);
    }

    return bit;
};

/** 改札外乗換1回に対応する地点。同駅なら1駅、異駅名なら接続する2駅を持つ。 */
type OutsideOpportunity = {
    /** 改札外乗換地点に属する駅。同駅は1駅、異駅名は2駅。 */
    stationIds: readonly StationId[];
};

/** 改札外乗換地点の一覧。配列の添字をビット位置として使う。 */
const outsideOpportunities: OutsideOpportunity[] = [];
/** 同駅の複数の路線ペアを、駅ごとに一つの改札外乗換地点へまとめる対応表。 */
const sameStationOutsideOpportunityIds = new Map<StationId, number>();
/** 駅と方向を区別しない路線ペアから、改札外乗換地点のビットを引く対応表。 */
const sameStationOutsideOpportunityBits = new Map<string, number>();

for (const [stationId, firstLineId, secondLineId] of SAME_STATION_OUTSIDE_TRANSFERS) {
    // 改札外乗換地点の添字。ビット位置として使う。
    let opportunityId = sameStationOutsideOpportunityIds.get(stationId);

    if (opportunityId == null) {
        opportunityId = outsideOpportunities.length;
        outsideOpportunities.push({ stationIds: [stationId] });
        sameStationOutsideOpportunityIds.set(stationId, opportunityId);
    }

    sameStationOutsideOpportunityBits.set(
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
        1 << opportunityId,
    );
}

/** 異駅名の接続定義の添字から、改札外乗換地点のビットを引く対応表。 */
const crossOutsideOpportunityBits = new Map<number, number>();

for (const [connectionIndex, connection] of CROSS_STATION_TRANSFERS.entries()) {
    if (connection.type !== 'outside') {
        continue;
    }

    // 改札外乗換地点の添字。ビット位置として使う。
    const opportunityId = outsideOpportunities.length;
    outsideOpportunities.push({ stationIds: [connection.fromStationId, connection.toStationId] });
    crossOutsideOpportunityBits.set(connectionIndex, 1 << opportunityId);
}

if (outsideOpportunities.length > 30) {
    throw new Error('改札外乗換地点がビットマスクの上限を超えています');
}

/** 全改札外乗換地点のビットを立てた集合。 */
const allOutsideOpportunityMask = (1 << outsideOpportunities.length) - 1;
/** 各駅に関係する改札外乗換地点の集合。異駅名の乗換は両駅へ同じビットを登録する。 */
const outsideOpportunityMaskByStation = new Map<StationId, number>(stationIds.map((stationId) => [stationId, 0]));

for (const [opportunityId, opportunity] of outsideOpportunities.entries()) {
    for (const stationId of opportunity.stationIds) {
        outsideOpportunityMaskByStation.set(
            stationId,
            (outsideOpportunityMaskByStation.get(stationId) ?? 0) | (1 << opportunityId),
        );
    }
}

/** 複数路線が所属する駅と異駅名乗換の両端駅。乗車区間の終点候補に使う。 */
const transferStationIds = new Set<StationId>([
    ...[...stationLineIds].filter(([, lineIds]) => lineIds.size > 1).map(([stationId]) => stationId),
    ...CROSS_STATION_TRANSFERS.flatMap(({ fromStationId, toStationId }) => [fromStationId, toStationId]),
]);

/** 路線と距離を区別せず、駅間で移動可能かだけを表す隣接関係。 */
const physicalStationGraph = new Map<StationId, Set<StationId>>(
    stationIds.map((stationId) => [stationId, new Set<StationId>()]),
);

for (const [stationId, edges] of graph) {
    for (const edge of edges) {
        physicalStationGraph.get(stationId)?.add(edge.stationId);
    }
}

/** excludedStationIdを通らずに、開始駅から到達できる駅を深さ優先で列挙する。 */
const getReachableStations = (startStationId: StationId, excludedStationId: StationId): Set<StationId> => {
    // 開始駅から到達済みの駅。重複探索の防止にも使う。
    const reachableStations = new Set<StationId>();
    // 隣接駅をまだ調べていない駅のスタック。
    const unsettledStations = [startStationId];

    while (unsettledStations.length > 0) {
        // スタックから取り出した今回の探索対象駅。
        const stationId = unsettledStations.pop();

        if (stationId == null || stationId === excludedStationId || reachableStations.has(stationId)) {
            continue;
        }

        reachableStations.add(stationId);

        for (const nextStationId of physicalStationGraph.get(stationId) ?? []) {
            unsettledStations.push(nextStationId);
        }
    }

    return reachableStations;
};

/**
 * 反対側の端点を通らずに発着両側から到達できる改札外乗換地点の集合を返す。
 * 異駅名の乗換は両駅とも条件を満たす必要がある。経路の存在判定ではなく候補の絞り込みに使う。
 */
const getOutsideOpportunityMaskBetweenEndpoints = (
    originStationId: StationId,
    destinationStationId: StationId,
): number => {
    // 着駅を通らずに発駅から到達できる駅。
    const reachableFromOrigin = getReachableStations(originStationId, destinationStationId);
    // 発駅を通らずに着駅から到達できる駅。
    const reachableFromDestination = getReachableStations(destinationStationId, originStationId);
    // 発着両側からの到達条件を満たす改札外乗換地点の集合。
    let mask = 0;

    for (const [opportunityId, opportunity] of outsideOpportunities.entries()) {
        if (
            opportunity.stationIds.every(
                (stationId) => reachableFromOrigin.has(stationId) && reachableFromDestination.has(stationId),
            )
        ) {
            mask |= 1 << opportunityId;
        }
    }

    return mask;
};

/** 到達判定用の隣接駅一覧。駅のビットをあらかじめ保持して探索中の参照を減らす。 */
const physicalNeighbors = new Map(
    [...physicalStationGraph].map(([stationId, neighbors]) => [
        stationId,
        [...neighbors].map((id) => ({ id, bit: getStationBit(id) })),
    ]),
);
/** 各改札外乗換地点に属する駅の集合。添字は乗換地点のビット位置に対応する。 */
const outsideOpportunityStationMasks = outsideOpportunities.map(({ stationIds }) =>
    stationIds.reduce((mask, id) => mask | getStationBit(id), BigInt(0)),
);

/**
 * 訪問済み駅への再進入を禁止したグラフで、着駅と未使用の必須乗換地点の全駅への到達可否を調べる。
 * 現在駅からの出発は許可する。路線や通過順は問わないため、trueは経路が存在するための必要条件。
 */
const canReachRequiredStations = (
    stationId: StationId,
    destinationStationId: StationId,
    visitedStationMask: bigint,
    requiredOutsideMask: number,
): boolean => {
    // 再出発を許可する現在駅のビット。
    const currentBit = getStationBit(stationId);
    // 到達確認が残る着駅と必須乗換地点の駅。発見するたびにビットを消す。
    let requiredStationMask = getStationBit(destinationStationId);
    for (let index = 0; index < outsideOpportunityStationMasks.length; index += 1) {
        if ((requiredOutsideMask & (1 << index)) !== 0) requiredStationMask |= outsideOpportunityStationMasks[index];
    }
    if ((requiredStationMask & (visitedStationMask & ~currentBit)) !== BigInt(0)) return false;
    // 進入を禁止する訪問済み駅と、この到達判定で発見済みの駅の集合。
    let seen = visitedStationMask;
    requiredStationMask &= ~currentBit;
    // 到達判定で隣接駅を確認するためのスタック。
    const pending = [stationId];
    while (pending.length > 0 && requiredStationMask !== BigInt(0)) {
        // 到達判定で隣接駅を調べる現在駅。
        const current = pending.pop();
        if (current == null) break;
        for (const neighbor of physicalNeighbors.get(current) ?? []) {
            if ((seen & neighbor.bit) !== BigInt(0)) continue;
            seen |= neighbor.bit;
            requiredStationMask &= ~neighbor.bit;
            pending.push(neighbor.id);
        }
    }
    return requiredStationMask === BigInt(0);
};

/** 駅選択用の公開一覧。表示順は駅データの定義順を維持する。 */
export const stations: StationOption[] = stationIds.map((id) => ({
    id,
    name: STATION_NAMES[id],
    lineIds: [...(stationLineIds.get(id) ?? [])],
}));

/** 文字列が登録済みの駅IDかを判定し、型を絞り込む。 */
export const isStationId = (value: string): value is StationId => Object.hasOwn(STATION_NAMES, value);

/** 駅IDを辞書順に並べ、往復で共通の駅間キーを作る。 */
const getStationPairKey = (firstStationId: StationId, secondStationId: StationId): string =>
    firstStationId < secondStationId ? `${firstStationId}:${secondStationId}` : `${secondStationId}:${firstStationId}`;

/** 実乗車距離と運賃計算距離が異なる駅間の補正値。単位は0.1km。 */
const fareCalculationDistanceOverrides = new Map(
    FARE_CALCULATION_DISTANCE_OVERRIDES.map(([firstStationId, secondStationId, distanceTenths]) => [
        getStationPairKey(firstStationId, secondStationId),
        distanceTenths,
    ]),
);

/** 起点ごとの最短実距離を保存する。主探索の距離下限に使う。 */
const actualShortestDistanceCache = new Map<StationId, Map<StationId, number>>();
/** 起点ごとの最短運賃計算距離を保存する。運賃表示に使う。 */
const fareShortestDistanceCache = new Map<StationId, Map<StationId, number>>();

/**
 * ダイクストラ法で起点から全駅への最短距離を求める。最小ヒープを使い、計算量はO(V + E log(E + 1))。
 * Vは駅数、Eは接続数。距離更新ごとに追加し、古い候補は取り出し時に捨てる。
 * 乗車距離はgetRideDistanceで指定し、異駅名の徒歩乗換は距離0として扱う。
 * excludedTransferDestinationを指定すると、起点からその駅への直接の徒歩乗換を除外する。
 * 路線の接続制約や駅の再訪制限は適用しない。到達不能な駅の距離はInfinityのまま返す。
 */
const calculateShortestDistances = (
    originStationId: StationId,
    getRideDistance: (fromStationId: StationId, edge: RideEdge) => number,
    excludedTransferDestination?: StationId,
): Map<StationId, number> => {
    // 起点から各駅までの最短距離。単位は0.1km。
    const distances = new Map<StationId, number>(stationIds.map((stationId) => [stationId, Number.POSITIVE_INFINITY]));
    const queue = createMinHeap<{ stationId: StationId; distance: number }>(
        (first, second) => first.distance - second.distance,
    );
    distances.set(originStationId, 0);
    queue.push({ stationId: originStationId, distance: 0 });

    for (let current = queue.pop(); current != null; current = queue.pop()) {
        const { stationId: currentStationId, distance: currentDistance } = current;
        // より短い距離で登録し直した駅の古い候補は展開しない。
        if (currentDistance !== distances.get(currentStationId)) continue;

        for (const edge of graph.get(currentStationId) ?? []) {
            if (
                edge.kind === 'transfer' &&
                currentStationId === originStationId &&
                edge.stationId === excludedTransferDestination
            ) {
                continue;
            }
            // 現在駅を経由して隣接駅へ進む場合の距離。
            const nextDistance = currentDistance + (edge.kind === 'ride' ? getRideDistance(currentStationId, edge) : 0);

            if (nextDistance < (distances.get(edge.stationId) ?? Number.POSITIVE_INFINITY)) {
                distances.set(edge.stationId, nextDistance);
                queue.push({ stationId: edge.stationId, distance: nextDistance });
            }
        }
    }

    return distances;
};

/** 実乗車距離で求めた最短距離を返し、起点ごとに再利用する。徒歩距離は0。 */
const getShortestActualDistances = (originStationId: StationId): Map<StationId, number> => {
    // 同じ条件で計算済みの値。存在すれば再計算を省く。
    const cached = actualShortestDistanceCache.get(originStationId);
    if (cached != null) return cached;

    // 起点から各駅までの最短距離。単位は0.1km。
    const distances = calculateShortestDistances(originStationId, (_fromStationId, edge) => edge.distanceTenths);
    actualShortestDistanceCache.set(originStationId, distances);
    return distances;
};

/**
 * 運賃計算用の駅間補正を適用して最短距離を求め、起点ごとに再利用する。
 * 別の駅への距離が徒歩だけで0になる場合は、その駅への起点からの直接徒歩接続を除いて再計算する。
 */
const getShortestFareDistances = (originStationId: StationId): Map<StationId, number> => {
    // 同じ条件で計算済みの値。存在すれば再計算を省く。
    const cached = fareShortestDistanceCache.get(originStationId);
    if (cached != null) return cached;

    /** 駅間に運賃計算距離の補正があれば適用し、それ以外は実乗車距離を使う。 */
    const getRideDistance = (fromStationId: StationId, edge: RideEdge): number =>
        fareCalculationDistanceOverrides.get(getStationPairKey(fromStationId, edge.stationId)) ?? edge.distanceTenths;
    // 起点から各駅までの最短距離。単位は0.1km。
    const distances = calculateShortestDistances(originStationId, getRideDistance);

    for (const [destinationStationId, distance] of distances) {
        if (destinationStationId === originStationId || distance !== 0) continue;

        // 発着駅間の徒歩接続だけでは乗車にならないため、この接続を除いて再計算する。
        // 他の発着区間の最短距離には、従来どおり徒歩乗換を含める。
        // 距離0となる相手駅への直接徒歩接続を除いて求めた距離。
        const ridingDistances = calculateShortestDistances(originStationId, getRideDistance, destinationStationId);
        distances.set(destinationStationId, ridingDistances.get(destinationStationId) ?? Number.POSITIVE_INFINITY);
    }

    fareShortestDistanceCache.set(originStationId, distances);
    return distances;
};

/** 0.1km単位の距離をkm単位に切り上げ、最低1kmとして距離帯別の運賃を返す。 */
const getRegularFare = (distanceTenths: number): Fare => {
    // 端数を切り上げ、最低1kmにした運賃判定用距離。
    const roundedKilometers = Math.max(1, Math.ceil(distanceTenths / 10));

    if (roundedKilometers <= 6) {
        return { ic: 178, ticket: 180 };
    }

    if (roundedKilometers <= 11) {
        return { ic: 209, ticket: 210 };
    }

    if (roundedKilometers <= 19) {
        return { ic: 252, ticket: 260 };
    }

    if (roundedKilometers <= 27) {
        return { ic: 293, ticket: 300 };
    }

    return { ic: 324, ticket: 330 };
};

/** 二つの駅が指定した駅ペアと一致するかを、方向を区別せず判定する。 */
const isSamePair = (first: StationId, second: StationId, pair: readonly [StationId, StationId]): boolean =>
    (first === pair[0] && second === pair[1]) || (first === pair[1] && second === pair[0]);

/** 綾瀬・北千住と南北線共用区間の特定運賃を先に判定し、それ以外は距離帯別運賃を返す。 */
const getFare = (originStationId: StationId, destinationStationId: StationId, distanceTenths: number): Fare => {
    if (isSamePair(originStationId, destinationStationId, ['ayase', 'kita-senju'])) {
        return { ic: 155, ticket: 160 };
    }

    // 相互発着に共用区間の運賃を適用する南北線の駅。
    const sharedNambokuSection = new Set<StationId>(['meguro', 'shirokanedai', 'shirokane-takanawa']);

    if (sharedNambokuSection.has(originStationId) && sharedNambokuSection.has(destinationStationId)) {
        return { ic: 178, ticket: 180 };
    }

    return getRegularFare(distanceTenths);
};

/**
 * 発着駅間の最短運賃計算距離と運賃を返す。到達可能な経路がない場合はエラーにする。
 * 途中の改札外出場駅は考慮しない。経路ごとの運賃はbuildRouteResultで求める。
 */
export const calculateFareBetweenStations = (
    originStationId: StationId,
    destinationStationId: StationId,
): Fare & { shortestDistanceTenths: number } => {
    // 発駅から着駅までの最短運賃計算距離。単位は0.1km。
    const shortestDistanceTenths = getShortestFareDistances(originStationId).get(destinationStationId);

    if (shortestDistanceTenths == null || !Number.isFinite(shortestDistanceTenths)) {
        throw new Error('駅間の経路を構成できません');
    }

    return {
        ...getFare(originStationId, destinationStationId, shortestDistanceTenths),
        shortestDistanceTenths,
    };
};

/** 乗車記録を乗換の位置で区切り、連続する乗車の距離を合算して表示用の区間を作る。 */
const buildLegs = (originStationId: StationId, steps: TraversalStep[]): RouteLeg[] => {
    // 乗換ごとに確定した表示用乗車区間。
    const legs: RouteLeg[] = [];
    // 連続する乗車を集約中の区間。乗換直後はnull。
    let currentLeg: RouteLeg | null = null;
    // 移動記録の処理時点での現在駅。
    let currentStationId = originStationId;

    for (const step of steps) {
        if (step.kind === 'transfer') {
            if (currentLeg != null) {
                legs.push(currentLeg);
                currentLeg = null;
            }

            currentStationId = step.toStationId;
            continue;
        }

        if (currentLeg == null) {
            currentLeg = {
                fromStationId: currentStationId,
                toStationId: step.toStationId,
                lineId: step.lineId,
                distanceTenths: step.distanceTenths,
            };
        } else {
            currentLeg.toStationId = step.toStationId;
            currentLeg.distanceTenths += step.distanceTenths;
        }

        currentStationId = step.toStationId;
    }

    if (currentLeg != null) {
        legs.push(currentLeg);
    }

    return legs;
};

/**
 * 探索中の移動記録を表示用の経路へ変換する。改札外乗換がない場合はnull。
 * 運賃は発駅から着駅への運賃と、発駅から各改札外出場駅への運賃の最大値を採用する。
 * 異駅名の乗換では出場側の駅を使い、IC・きっぷそれぞれの最大値を求める。
 */
const buildRouteResult = (
    originStationId: StationId,
    destinationStationId: StationId,
    steps: TraversalStep[],
    shortestDistances: Map<StationId, number>,
    actualDistanceTenths: number,
): RouteResult | null => {
    // 移動記録から抽出した、経路順の乗換一覧。
    const transfers = steps
        .filter((step): step is TransferStep => step.kind === 'transfer')
        .map(({ kind: _kind, ...transfer }) => transfer);
    // 経路順に並んだ改札外乗換。運賃確認と回数集計に使う。
    const outsideTransfers = transfers.filter((transfer) => transfer.type === 'outside');

    if (outsideTransfers.length === 0) {
        return null;
    }

    // 発駅から着駅までの最短運賃計算距離。単位は0.1km。
    const shortestDistanceTenths = shortestDistances.get(destinationStationId) ?? Number.POSITIVE_INFINITY;
    // 途中出場を考慮する前の、発着駅間の運賃。
    const baseFare = getFare(originStationId, destinationStationId, shortestDistanceTenths);
    // 各改札外出場駅までの運賃確認結果。
    const fareCheckpoints = outsideTransfers.map((transfer) => {
        // 発駅から今回の出場駅までの最短運賃計算距離。
        const checkpointDistance = shortestDistances.get(transfer.fromStationId) ?? Number.POSITIVE_INFINITY;

        return {
            stationId: transfer.fromStationId,
            shortestDistanceTenths: checkpointDistance,
            fare: getFare(originStationId, transfer.fromStationId, checkpointDistance),
        };
    });
    // 着駅と各出場駅までの運賃の最大値。IC・きっぷ別に求める。
    const fare = fareCheckpoints.reduce(
        (highestFare, checkpoint) => ({
            ic: Math.max(highestFare.ic, checkpoint.fare.ic),
            ticket: Math.max(highestFare.ticket, checkpoint.fare.ticket),
        }),
        baseFare,
    );

    return {
        key: steps
            .map((step) =>
                step.kind === 'ride'
                    ? `${step.lineId}:${step.fromStationId}>${step.toStationId}`
                    : `${step.type}:${step.fromLineId}>${step.toLineId}:${step.fromStationId}>${step.toStationId}`,
            )
            .join('|'),
        legs: buildLegs(originStationId, steps),
        transfers,
        outsideTransferCount: outsideTransfers.length,
        insideTransferCount: transfers.length - outsideTransfers.length,
        actualDistanceTenths,
        shortestDistanceTenths,
        fare,
        fareCheckpoints,
    };
};

/** 同一路線で乗車し続け、乗換駅または着駅で終わる探索用区間。 */
type MacroSegment = {
    /** 区間または乗換の開始駅。 */
    fromStationId: StationId;
    /** 区間または乗換の終了駅。 */
    toStationId: StationId;
    /** 乗車する路線。 */
    lineId: LineId;
    /** 区間内の隣接駅間の乗車記録。経路結果の復元に使う。 */
    rideSteps: RideStep[];
    /** 開始駅を除き、終点を含む区間内の通過駅の集合。 */
    stationMask: bigint;
    /** 開始駅を除く通過駅に関係する改札外乗換地点の集合。 */
    outsideOpportunityMask: number;
    /** 乗車距離。単位は0.1km。 */
    distanceTenths: number;
};

/** 区間間の乗換と、それによって使用する改札外乗換地点のビット。 */
type MacroTransfer = {
    /** この乗換の移動記録。 */
    step: TransferStep;
    /** 使用する改札外乗換地点のビット。改札内なら0。 */
    outsideOpportunityBit: number;
};

/** 現在駅と乗車中の路線をキーに、利用可能な乗換を保存する。 */
const macroTransferCache = new Map<string, MacroTransfer[]>();

/**
 * 現在駅・路線からの同駅乗換と異駅名乗換を列挙する。
 * 改札外を優先し、同種なら乗換先路線ID、乗換先駅IDの順に整列して保存する。
 */
const getMacroTransfers = (stationId: StationId, fromLineId: LineId): MacroTransfer[] => {
    // 計算結果を再利用するための入力条件のキー。
    const cacheKey = `${stationId}:${fromLineId}`;
    // 同じ条件で計算済みの値。存在すれば再計算を省く。
    const cached = macroTransferCache.get(cacheKey);

    if (cached != null) {
        return cached;
    }

    // 現在駅・路線から利用可能な乗換候補。
    const transfers: MacroTransfer[] = [];

    for (const toLineId of stationLineIds.get(stationId) ?? []) {
        if (toLineId === fromLineId) {
            continue;
        }

        for (const transferType of getSameStationTransferTypes(stationId, fromLineId, toLineId)) {
            transfers.push({
                step: {
                    kind: 'transfer',
                    fromStationId: stationId,
                    toStationId: stationId,
                    fromLineId,
                    toLineId,
                    type: transferType,
                },
                outsideOpportunityBit:
                    transferType === 'outside'
                        ? (sameStationOutsideOpportunityBits.get(
                              [stationId, ...[fromLineId, toLineId].sort()].join(':'),
                          ) ?? 0)
                        : 0,
            });
        }
    }

    for (const [connectionIndex, connection] of CROSS_STATION_TRANSFERS.entries()) {
        // 接続定義の出発側が現在駅か。
        const isForward = connection.fromStationId === stationId;
        // 接続定義の到着側が現在駅か。
        const isBackward = connection.toStationId === stationId;

        if (!isForward && !isBackward) {
            continue;
        }

        for (const [firstLineId, secondLineId] of connection.linePairs) {
            // 移動方向に対応する乗換前の路線。
            const expectedFromLineId = isForward ? firstLineId : secondLineId;

            if (expectedFromLineId !== fromLineId) {
                continue;
            }

            transfers.push({
                step: {
                    kind: 'transfer',
                    fromStationId: stationId,
                    toStationId: isForward ? connection.toStationId : connection.fromStationId,
                    fromLineId,
                    toLineId: isForward ? secondLineId : firstLineId,
                    type: connection.type,
                },
                outsideOpportunityBit: crossOutsideOpportunityBits.get(connectionIndex) ?? 0,
            });
        }
    }

    transfers.sort(
        (first, second) =>
            Number(second.step.type === 'outside') - Number(first.step.type === 'outside') ||
            first.step.toLineId.localeCompare(second.step.toLineId) ||
            first.step.toStationId.localeCompare(second.step.toStationId),
    );
    macroTransferCache.set(cacheKey, transfers);
    return transfers;
};

/** 開始駅・路線・着駅をキーに乗車区間を保存する。訪問履歴による除外は主探索で行う。 */
const macroSegmentCache = new Map<string, MacroSegment[]>();

/**
 * 同一路線のグラフを深さ優先でたどり、乗換駅または着駅までの乗車区間を列挙する。
 * 途中の乗換駅は通過も認めるが、着駅に達したら延長しない。区間内での駅の再訪は禁止する。
 */
const getMacroSegments = (
    fromStationId: StationId,
    lineId: LineId,
    destinationStationId: StationId,
): MacroSegment[] => {
    // 計算結果を再利用するための入力条件のキー。
    const cacheKey = `${fromStationId}:${lineId}:${destinationStationId}`;
    // 同じ条件で計算済みの値。存在すれば再計算を省く。
    const cached = macroSegmentCache.get(cacheKey);

    if (cached != null) {
        return cached;
    }

    // 処理対象の路線に属する乗車接続。
    const lineGraph = lineGraphs.get(lineId);

    if (lineGraph == null) {
        return [];
    }

    // 同一路線を乗り続けて到達する乗車区間の一覧。
    const segments: MacroSegment[] = [];
    // 現在組み立てている乗車区間内の訪問済み駅。戻る際に取り消す。
    const visitedStations = new Set<StationId>([fromStationId]);
    // 現在組み立てている区間の隣接駅間の乗車記録。
    const rideSteps: RideStep[] = [];

    /**
     * 同一路線の乗車区間を再帰的に延長する。候補に保存するときは乗車記録を複製する。
     * stationMaskは開始駅を除く通過駅、outsideOpportunityMaskはその駅に関係する乗換地点。
     * distanceTenthsは開始駅から現在駅までの累積実乗車距離。再帰後に訪問履歴と記録を戻す。
     */
    const visit = (
        stationId: StationId,
        stationMask: bigint,
        outsideOpportunityMask: number,
        distanceTenths: number,
    ): void => {
        if (stationId !== fromStationId && (stationId === destinationStationId || transferStationIds.has(stationId))) {
            segments.push({
                fromStationId,
                toStationId: stationId,
                lineId,
                rideSteps: [...rideSteps],
                stationMask,
                outsideOpportunityMask,
                distanceTenths,
            });
        }

        if (stationId === destinationStationId) {
            return;
        }

        for (const edge of lineGraph.get(stationId) ?? []) {
            if (visitedStations.has(edge.stationId)) {
                continue;
            }

            // 今回追加する隣接駅への乗車記録。
            const rideStep: RideStep = {
                kind: 'ride',
                fromStationId: stationId,
                toStationId: edge.stationId,
                lineId,
                distanceTenths: edge.distanceTenths,
            };
            visitedStations.add(edge.stationId);
            rideSteps.push(rideStep);
            visit(
                edge.stationId,
                stationMask | getStationBit(edge.stationId),
                outsideOpportunityMask | (outsideOpportunityMaskByStation.get(edge.stationId) ?? 0),
                distanceTenths + edge.distanceTenths,
            );
            rideSteps.pop();
            visitedStations.delete(edge.stationId);
        }
    };

    visit(fromStationId, BigInt(0), 0, 0);
    macroSegmentCache.set(cacheKey, segments);
    return segments;
};

/** 改札外乗換数の降順、改札内乗換数・実乗車距離の昇順、経路キーの順で比較する。 */
const compareRoutes = (first: RouteResult, second: RouteResult): number =>
    second.outsideTransferCount - first.outsideTransferCount ||
    first.insideTransferCount - second.insideTransferCount ||
    first.actualDistanceTenths - second.actualDistanceTenths ||
    first.key.localeCompare(second.key);

/** 最下位の立っているビットを順に消し、集合に含まれる改札外乗換地点数を数える。 */
const countBits = (value: number): number => {
    // まだ数えていないビット。
    let remaining = value;
    // これまでに数えたビット数。
    let count = 0;

    while (remaining !== 0) {
        remaining &= remaining - 1;
        count += 1;
    }

    return count;
};

/** 返却候補数の上限。順位付け探索中もこの件数まで保持する。 */
export const SEARCH_RESULT_LIMIT = 20;
/** 検索全体で許可する主探索の再帰呼出し回数の既定値。 */
export const SEARCH_VISIT_LIMIT = 5_000_000;
/** 前処理を含む検索時間の目安となる既定値。単位はミリ秒。 */
export const SEARCH_DURATION_LIMIT_MS = 5_000;
/** 利用者が指定できる改札外乗換回数の上限。 */
export const MAX_OUTSIDE_TRANSFER_COUNT = 14;

/** 期限を再確認するまでの主探索の訪問回数。 */
const SEARCH_DEADLINE_CHECK_INTERVAL = 1_000;
/** 候補探索に配分する残り時間・訪問数の除数。順位付け探索は残り全量を使う。 */
const DISCOVERY_BUDGET_DIVISOR = 4;
/** 一つの乗換回数について候補発見に使う訪問数の上限。 */
const DISCOVERY_VISIT_LIMIT = 125_000;

/** 検索全体の探索予算。省略した項目は既定値を使う。 */
export type RouteSearchBudget = {
    /** 検索全体で許可する訪問数。 */
    visitLimit?: number;
    /** 前処理を含む検索時間の目安。再帰入口で定期的に確認する。 */
    durationLimitMs?: number;
};

/** 指定回数が1以上かつ公開上限以下の整数かを判定する。 */
export const isValidMaximumOutsideTransferCount = (value: number): boolean =>
    Number.isInteger(value) && value >= 1 && value <= MAX_OUTSIDE_TRANSFER_COUNT;

/**
 * 発着駅と改札外乗換回数の上限から、発見できた最大回数の経路を最大20件返す。
 * maximumOutsideTransferCountがnullなら、利用可能な改札外乗換地点数を上限にする。
 * budgetは主探索の訪問数と前処理を含む時間の予算。回数上限・予算が不正ならエラーにする。
 * 発着駅が同じ場合は探索せず、経路なしの確定結果を返す。
 * 探索打ち切り時の候補・最大回数・順位の確定状況はRouteSearchResultを参照する。
 */
export const searchRoutes = (
    originStationId: StationId,
    destinationStationId: StationId,
    maximumOutsideTransferCount: number | null = null,
    budget: RouteSearchBudget = {},
): RouteSearchResult => {
    if (maximumOutsideTransferCount != null && !isValidMaximumOutsideTransferCount(maximumOutsideTransferCount)) {
        throw new Error(`最大改札外乗換回数は1〜${MAX_OUTSIDE_TRANSFER_COUNT}回で指定してください`);
    }

    // 検索全体で許可する主探索の訪問数。
    const visitLimit = budget.visitLimit ?? SEARCH_VISIT_LIMIT;
    // 前処理を含む検索時間の目安。単位はミリ秒。
    const durationLimitMs = budget.durationLimitMs ?? SEARCH_DURATION_LIMIT_MS;
    if (
        !Number.isSafeInteger(visitLimit) ||
        visitLimit < 0 ||
        !Number.isFinite(durationLimitMs) ||
        durationLimitMs < 0
    ) {
        throw new Error('探索予算は0以上の有限値で指定してください（訪問数は整数）');
    }
    // 検索全体の終了期限。performance.nowと同じ時刻基準。
    const searchDeadline = performance.now() + durationLimitMs;
    if (originStationId === destinationStationId) {
        return { routes: [], truncated: false, outsideTransferUpperBound: 0 };
    }

    // 発駅から全駅への最短運賃計算距離。候補間で共用する。
    const shortestDistances = getShortestFareDistances(originStationId);
    // 各駅から着駅への実距離の下限。双方向グラフのため着駅を起点に計算する。
    const shortestActualDistancesToDestination = getShortestActualDistances(destinationStationId);
    // 発駅または着駅を含み、乗換地点として使えない改札外乗換地点の集合。
    const unavailableOutsideMask =
        (outsideOpportunityMaskByStation.get(originStationId) ?? 0) |
        (outsideOpportunityMaskByStation.get(destinationStationId) ?? 0);
    // 発着駅の除外と到達条件を満たす改札外乗換地点の集合。
    const availableOutsideMask =
        allOutsideOpportunityMask &
        getOutsideOpportunityMaskBetweenEndpoints(originStationId, destinationStationId) &
        ~unavailableOutsideMask;
    // 利用可能な改札外乗換地点の数。
    const availableOutsideCount = countBits(availableOutsideMask);
    // 利用可能な地点数と利用者の指定上限の小さい方。
    const maximumOutsideCount = Math.min(availableOutsideCount, maximumOutsideTransferCount ?? availableOutsideCount);
    // すべての回数の候補探索と順位付け探索で共有する残り訪問数。
    let remainingVisitCount = visitLimit;
    // これまでに発見した最大回数の候補。さらに多い回数が見つかったら置き換える。
    let bestRoutes: RouteResult[] = [];
    // 探索が完了していない回数の最大値。0は未確定の回数がない状態。
    let truncatedUpperBound = 0;
    // 指定上限によらず同じ順序・予算で探索し、発見済みの最大回数を保持する。
    // 1回から上限までの候補探索と、最後の順位付け探索を表すnull。
    const targets: (number | null)[] = Array.from({ length: maximumOutsideCount }, (_, index) => index + 1);
    targets.push(null); // 候補発見後、残り予算で最大回数の候補を順位付けする。

    for (const target of targets) {
        // 最初の候補で止めず、最大回数の上位候補を探す段階か。
        const isRankingSearch = target === null;
        // 今回ちょうどこの回数の改札外乗換を含む経路を探す。
        const targetOutsideCount = target ?? bestRoutes[0]?.outsideTransferCount;
        if (targetOutsideCount == null) continue;
        // 今回の探索で見つけた候補。比較順に整列し、最大20件を保持する。
        const results: RouteResult[] = [];
        // 今回の探索開始時刻。
        const targetStart = performance.now();
        // 候補探索は残り予算の1/4、順位付け探索は全量を配分するための除数。
        const budgetDivisor = isRankingSearch ? 1 : DISCOVERY_BUDGET_DIVISOR;
        // 今回の探索に配分した時間の期限。
        const targetDeadline = targetStart + Math.max(0, searchDeadline - targetStart) / budgetDivisor;
        // 今回の探索に配分する訪問数。全体の残量を超えない。
        const targetVisitLimit = isRankingSearch
            ? remainingVisitCount
            : Math.min(
                  remainingVisitCount,
                  DISCOVERY_VISIT_LIMIT,
                  Math.max(10_000, Math.floor(remainingVisitCount / budgetDivisor)),
              );
        // 今回の探索で使える残り訪問数。
        let remainingTargetVisitCount = targetVisitLimit;
        // 次の期限確認までの訪問数。初回も確認するため0から始める。
        let remainingDeadlineCheckCount = 0;
        // 今回の探索が訪問数または時間の制限に達したか。
        let targetTruncated = false;
        // 候補探索で最初の1件を見つけたか。順位付け探索では常にfalse。
        let candidateFound = false;

        /** 候補を順位順に挿入して上限超過分を除き、候補探索なら最初の発見を通知する。 */
        const addResult = (result: RouteResult): void => {
            candidateFound = !isRankingSearch;
            // 上限に達していて最下位を改善しない候補は、配列を変更せずに捨てる。
            if (results.length === SEARCH_RESULT_LIMIT && compareRoutes(result, results[results.length - 1]) >= 0) {
                return;
            }

            let low = 0;
            let high = results.length;
            while (low < high) {
                const middle = Math.floor((low + high) / 2);
                // 同順位の後ろに挿入し、従来の安定ソートと同じ順序を保つ。
                if (compareRoutes(result, results[middle]) < 0) high = middle;
                else low = middle + 1;
            }
            results.splice(low, 0, result);

            if (results.length > SEARCH_RESULT_LIMIT) {
                results.pop();
            }
        };

        for (
            // 今回すべて使用する改札外乗換地点の組合せ。利用可能な集合の部分集合を順に列挙する。
            let requiredOutsideMask = availableOutsideMask;
            requiredOutsideMask > 0;
            requiredOutsideMask = (requiredOutsideMask - 1) & availableOutsideMask
        ) {
            if (countBits(requiredOutsideMask) !== targetOutsideCount) {
                continue;
            }

            // 現在の経路に含む乗車区間。再帰から戻る際に末尾を取り除く。
            const segmentStack: MacroSegment[] = [];
            // 各乗車区間の直後の乗換。segmentStackの添字と対応する。
            const transferStack: MacroTransfer[] = [];

            /**
             * 現在駅・路線から乗車区間と乗換を交互に選ぶ深さ優先探索。
             * visitedStationMaskは発駅と乗換先を含む訪問済み駅、usedOutsideMaskは使用済みの必須地点。
             * insideTransferCountとactualDistanceTenthsは現在までの改札内乗換数と実乗車距離。
             * 再帰入口で予算を消費し、順位・到達可能性・再訪・必須地点の使用条件で枝を除く。
             */
            const visit = (
                stationId: StationId,
                lineId: LineId,
                visitedStationMask: bigint,
                usedOutsideMask: number,
                insideTransferCount: number,
                actualDistanceTenths: number,
            ): void => {
                if (remainingTargetVisitCount === 0 || remainingVisitCount === 0) {
                    targetTruncated = true;
                    return;
                }

                if (remainingDeadlineCheckCount === 0) {
                    if (performance.now() >= targetDeadline) {
                        targetTruncated = true;
                        return;
                    }

                    remainingDeadlineCheckCount = SEARCH_DEADLINE_CHECK_INTERVAL;
                }

                remainingTargetVisitCount -= 1;
                remainingVisitCount -= 1;
                remainingDeadlineCheckCount -= 1;
                // 20件そろった場合の最下位候補。これを改善できない枝を除く基準。
                const worstResult = results.length === SEARCH_RESULT_LIMIT ? results.at(-1) : null;

                if (worstResult != null) {
                    // 現在駅から着駅までの実乗車距離の下限。訪問制約を緩めた最短距離を使う。
                    const shortestRemainingDistance =
                        shortestActualDistancesToDestination.get(stationId) ?? Number.POSITIVE_INFINITY;

                    if (
                        insideTransferCount > worstResult.insideTransferCount ||
                        (insideTransferCount === worstResult.insideTransferCount &&
                            actualDistanceTenths + shortestRemainingDistance > worstResult.actualDistanceTenths)
                    ) {
                        return;
                    }
                }

                // 今回の組合せのうち、まだ使用していない改札外乗換地点。
                const remainingRequiredMask = requiredOutsideMask & ~usedOutsideMask;
                if (
                    !canReachRequiredStations(
                        stationId,
                        destinationStationId,
                        visitedStationMask,
                        remainingRequiredMask,
                    )
                ) {
                    return;
                }
                // 再訪する区間を除き、未使用の必須地点を含む区間、距離、駅IDの順に並べた候補。
                const segments = getMacroSegments(stationId, lineId, destinationStationId)
                    .filter((segment) => (visitedStationMask & segment.stationMask) === BigInt(0))
                    .sort(
                        (first, second) =>
                            Number((second.outsideOpportunityMask & remainingRequiredMask) !== 0) -
                                Number((first.outsideOpportunityMask & remainingRequiredMask) !== 0) ||
                            first.distanceTenths - second.distanceTenths ||
                            first.toStationId.localeCompare(second.toStationId),
                    );

                for (const segment of segments) {
                    if (targetTruncated || candidateFound) {
                        return;
                    }

                    // 乗車区間が通る未使用の必須乗換地点。終点で使えない地点の通過を検出する。
                    const touchedRequiredMask = segment.outsideOpportunityMask & requiredOutsideMask & ~usedOutsideMask;

                    // 1区間の終点で使える乗換地点は一つ。複数の必須地点を通ると未使用のまま通過する。
                    if (countBits(touchedRequiredMask) > 1) {
                        continue;
                    }

                    // 今回の乗車区間の通過駅を加えた訪問済み駅の集合。
                    const nextVisitedStationMask = visitedStationMask | segment.stationMask;
                    // 今回の区間を加えた実乗車距離。単位は0.1km。
                    const nextDistanceTenths = actualDistanceTenths + segment.distanceTenths;
                    segmentStack.push(segment);

                    if (segment.toStationId === destinationStationId) {
                        if (touchedRequiredMask === 0 && usedOutsideMask === requiredOutsideMask) {
                            // 区間と乗換のスタックを経路順に展開した移動記録。
                            const steps: TraversalStep[] = [];

                            for (const [segmentIndex, routeSegment] of segmentStack.entries()) {
                                steps.push(...routeSegment.rideSteps);

                                // この乗車区間の直後に行った乗換。最終区間には存在しない。
                                const transfer = transferStack[segmentIndex];

                                if (transfer != null) {
                                    steps.push(transfer.step);
                                }
                            }

                            // 移動記録から生成した表示用候補。改札外乗換がなければnull。
                            const result = buildRouteResult(
                                originStationId,
                                destinationStationId,
                                steps,
                                shortestDistances,
                                nextDistanceTenths,
                            );

                            if (result != null) {
                                addResult(result);
                            }
                        }

                        segmentStack.pop();
                        continue;
                    }

                    for (const transfer of getMacroTransfers(segment.toStationId, lineId)) {
                        if (targetTruncated || candidateFound) {
                            return;
                        }

                        // 今回選ぶ乗換が改札外乗換か。
                        const isOutside = transfer.step.type === 'outside';

                        // 改札外は指定した未使用地点に限り、区間内で触れた必須地点をここで使用する。
                        // 改札内を選ぶ場合は、区間内で未使用の必須地点を通っていてはいけない。
                        if (
                            (isOutside &&
                                ((requiredOutsideMask & transfer.outsideOpportunityBit) === 0 ||
                                    (usedOutsideMask & transfer.outsideOpportunityBit) !== 0 ||
                                    touchedRequiredMask !== transfer.outsideOpportunityBit)) ||
                            (!isOutside && touchedRequiredMask !== 0)
                        ) {
                            continue;
                        }

                        // 異駅名間の乗換として駅IDが変わるか。
                        const changesStation = transfer.step.toStationId !== transfer.step.fromStationId;

                        if (
                            changesStation &&
                            (nextVisitedStationMask & getStationBit(transfer.step.toStationId)) !== BigInt(0)
                        ) {
                            continue;
                        }

                        // 乗換先の駅も加えた訪問済み駅の集合。同駅の乗換なら変化しない。
                        const afterTransferVisitedMask =
                            nextVisitedStationMask | getStationBit(transfer.step.toStationId);
                        transferStack.push(transfer);
                        visit(
                            transfer.step.toStationId,
                            transfer.step.toLineId,
                            afterTransferVisitedMask,
                            usedOutsideMask | transfer.outsideOpportunityBit,
                            insideTransferCount + Number(!isOutside),
                            nextDistanceTenths,
                        );
                        transferStack.pop();
                    }

                    segmentStack.pop();
                }
            };

            for (const lineId of stationLineIds.get(originStationId) ?? []) {
                visit(originStationId, lineId, getStationBit(originStationId), 0, 0, 0);

                if (targetTruncated || candidateFound) {
                    break;
                }
            }

            if (targetTruncated || candidateFound) {
                break;
            }
        }

        // 最初の候補で終了した回数も、順位付けが済むまでは未確定として記録する。
        if (targetTruncated || candidateFound) {
            truncatedUpperBound = Math.max(truncatedUpperBound, targetOutsideCount);
        }
        // 今回の探索で候補を得られなかった場合は、それまでの最大回数の候補を残す。
        if (results.length > 0) {
            bestRoutes = results;
        }
        // 最大回数の順位付けが完了し、より多い回数に未探索部分がなければ未確定状態を解消する。
        if (isRankingSearch && !targetTruncated && truncatedUpperBound === targetOutsideCount) {
            truncatedUpperBound = 0;
        }
    }

    // 発見できた候補の最大改札外乗換回数。候補がなければ0。
    const bestOutsideCount = bestRoutes[0]?.outsideTransferCount ?? 0;
    return {
        routes: bestRoutes,
        truncated: truncatedUpperBound > 0 && truncatedUpperBound >= bestOutsideCount,
        outsideTransferUpperBound: Math.max(truncatedUpperBound, bestOutsideCount),
    };
};

/** 0.1km単位の整数を、小数点以下1桁のkm表記へ変換する。 */
export const formatDistance = (distanceTenths: number): string => `${(distanceTenths / 10).toFixed(1)}km`;

/** 路線IDに対応する表示名を返す。 */
export const getLineLabel = (lineId: LineId): string => LINE_DEFINITIONS[lineId].name;
