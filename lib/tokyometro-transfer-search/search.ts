/**
 * 東京メトロ 改札外乗換検索のアルゴリズム。
 *
 * 対象は、異なる発着駅を結び、改札外乗換を1回以上含む駅の再訪がない経路。
 * 乗車区間と乗換を交互に接続し、最初と最後は必ず乗車する。乗換だけの連続移動は扱わない。
 * 同駅での乗換は駅の再訪に数えず、異駅名の乗換では両方の駅を訪問済みにする。
 * 同じ路線の再利用は認める。指定する回数上限は改札外乗換だけに適用する。
 * 改札内乗換は既定で候補に含む。includeInsideTransfersがfalseなら、探索時に改札内乗換を除外する。
 * この条件で経路が存在しなければ空の候補を返す。探索打ち切りの扱いは有効時と同じ。
 * outsideTransferIdsで利用する改札外乗換地点を選ぶ。未指定は全地点を利用し、空配列・不正なIDはエラーにする。
 * 同駅の乗換は駅単位、異駅名の乗換は接続単位で選択する。IDは接続定義の先頭駅とし、両方向に適用する。
 * 選択した全地点を使うことは必須ではない。未選択地点での改札外乗換だけを除外し、
 * その駅の通過や、includeInsideTransfersがtrueの場合の改札内乗換は認める。
 * 距離はすべて0.1km単位の整数で扱い、徒歩乗換の距離は加算しない。
 *
 * 1. 共通路線網・区間列挙（lib/tokyometro-core）を使い、探索用の集合を作る。
 *    訪問済みの駅はbigintのビットマスク（各ビットが1駅を表す集合）で管理する。
 *    改札外乗換地点は同駅なら駅ごと、異駅名なら接続定義ごとに1ビットを割り当てる。
 *    こちらはnumberのビット演算を使うため、地点数を30以下に制限する。
 * 2. 選択した改札外乗換地点から、発着駅を含む地点を除外する。さらに、反対側の端点を通らずに
 *    発駅・着駅の双方から到達できる地点だけを残し、探索回数の上限を求める。
 *    この到達判定は路線を区別しない必要条件であり、経路の存在を保証しない。
 *    探索回数の上限は、残った地点数とmaximumOutsideTransferCountの小さい方。回数未指定なら地点数を使う。
 * 3. 改札外乗換1回から上限まで順に候補を探す。各回数について、その個数の
 *    改札外乗換地点の組合せを列挙し、組合せに含む地点をすべて使う経路を深さ優先で探索する。
 *    同一路線で乗り続ける区間は、乗換駅または着駅までをMacroSegmentにまとめて扱う。
 *    区間は生成時に実乗車距離・終点駅ID順で整列し、未使用の必須地点を含む区間から走査する。
 *    駅の再訪、必須地点の通過による乗換機会の喪失、残りの必須駅への到達不能を除外する。
 *    各回数の候補探索は最初の1件で中断し、それまでに見つけた最大回数の候補を保持する。
 * 4. 残り予算で、発見済み回数より多い未確定の回数を中断位置から繰り返し探索する。
 *    その後、発見済みの最大回数について探索を続け、上位20件を保持する。
 *    比較順は改札外乗換の多い順、改札内乗換の少ない順、実乗車距離の短い順、経路キー順。
 *    最大回数の候補だけを返し、20件未満でも少ない回数の経路で補充しない。
 *    20件そろった後は、改札内乗換数と着駅までの最短実距離を使い、順位を改善できない枝を除く。
 * 5. 探索は既定で合計500万訪問・5秒を目安に制限する。訪問数は主探索の再帰呼出しを数える。
 *    画面からdurationLimitMsをミリ秒単位の正の整数で指定できる。訪問数の上限は変更しない。
 *    各回数の初回探索には前処理後の残り時間の1/28・訪問予算の1/56を配分し、続行の予算を残す。
 *    続行時の時間は未確定の回数に均等配分し、未消費分を再配分する。
 *    候補発見のための1回の配分は最大12万5000訪問とし、全体の残り訪問数を超えない。
 *    最大回数の順位付けには全体の残り時間・訪問数を使う。
 *    時間は各探索の初回と以後1000訪問ごとに確認するため、厳密な実行時間の上限ではない。
 *    前処理も時間予算に含むが、前処理中には期限を確認しない。
 * 6. 未探索部分が結果に影響し得る場合はtruncatedをtrueにする。
 *    outsideTransferUpperBoundは未探索部分を含む最大回数の上限を表す。
 *    候補の回数がこの上限に一致すれば最大回数は確定するが、順位は未確定の場合がある。
 *    候補が空でもtruncatedがtrueなら、経路が存在しないとは確定していない。
 *
 * 探索用キャッシュは検索モジュール内、路線網・距離・区間のキャッシュは共通モジュール内で共有する。
 *
 * 運賃は経路探索と分けて求める。ダイクストラ法で発駅から各駅への最短運賃計算距離を計算し、
 * 距離帯別運賃と特定区間の運賃を適用する。経路の運賃は、着駅と各改札外出場駅までの
 * 運賃の最大値をIC・きっぷ別に採用する。探索時の実乗車距離と運賃計算距離は区別する。
 * outsideTransferIdsとincludeInsideTransfersは、運賃計算用の最短距離に適用しない。
 */

import {
    CROSS_STATION_TRANSFERS,
    type LineId,
    SAME_STATION_OUTSIDE_TRANSFERS,
    type StationId,
} from '@/lib/tokyometro-core/data';
import { getShortestActualDistances, getShortestFareDistances } from '@/lib/tokyometro-core/distances';
import { calculateRouteFare } from '@/lib/tokyometro-core/fare';
import { graph, stationIds, stationLineIds } from '@/lib/tokyometro-core/network';
import { getRideSegments, getTransfers, type RideSegment } from '@/lib/tokyometro-core/routing';
import type { RouteLeg, RouteResult, TransferStep, TraversalStep } from '@/lib/tokyometro-core/types';
import { allOutsideTransferIds, outsideTransferIdsSchema } from '@/lib/tokyometro-transfer-search/outside-transfers';
import {
    MAX_OUTSIDE_TRANSFER_COUNT,
    maximumOutsideTransferCountSchema,
    searchBudgetSchema,
} from '@/lib/tokyometro-transfer-search/validation';

export { MAX_OUTSIDE_TRANSFER_COUNT } from '@/lib/tokyometro-transfer-search/validation';

/** 検索候補と、探索の完了状況および最大回数の上限。 */
export type RouteSearchResult = {
    /** 発見済みの最大改札外乗換回数を持つ候補。順位順で最大20件。 */
    routes: RouteResult[];
    /** 未探索部分により最大回数または上位候補の順位が未確定ならtrue。 */
    truncated: boolean;
    /** 未探索部分を含む改札外乗換回数の上限。候補の回数と一致すれば最大回数は確定。 */
    outsideTransferUpperBound: number;
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

/** 「出場駅ID:出場路線ID:入場駅ID:入場路線ID」から改札外乗換地点のビットを引く対応表。往復を登録する。 */
const crossOutsideOpportunityBits = new Map<string, number>();

for (const connection of CROSS_STATION_TRANSFERS) {
    if (connection.type !== 'outside') {
        continue;
    }

    // 改札外乗換地点の添字。ビット位置として使う。
    const opportunityId = outsideOpportunities.length;
    outsideOpportunities.push({ stationIds: [connection.fromStationId, connection.toStationId] });
    for (const [fromLineId, toLineId] of connection.linePairs) {
        crossOutsideOpportunityBits.set(
            `${connection.fromStationId}:${fromLineId}:${connection.toStationId}:${toLineId}`,
            1 << opportunityId,
        );
        crossOutsideOpportunityBits.set(
            `${connection.toStationId}:${toLineId}:${connection.fromStationId}:${fromLineId}`,
            1 << opportunityId,
        );
    }
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
        ...calculateRouteFare(originStationId, destinationStationId, transfers, shortestDistances),
    };
};

/** 同一路線で乗車し続け、乗換駅または着駅で終わる探索用区間。 */
type MacroSegment = RideSegment & {
    /** 開始駅を除き、終点を含む区間内の通過駅の集合。 */
    stationMask: bigint;
    /** 開始駅を除く通過駅に関係する改札外乗換地点の集合。 */
    outsideOpportunityMask: number;
};

/** 区間間の乗換と、それによって使用する改札外乗換地点のビット。 */
type MacroTransfer = {
    /** この乗換の移動記録。 */
    step: TransferStep;
    /** 使用する改札外乗換地点のビット。改札内なら0。 */
    outsideOpportunityBit: number;
};

/** 「現在駅ID:乗車中の路線ID」から、検索用の乗換と地点ビットを引くキャッシュ。 */
const macroTransferCache = new Map<string, MacroTransfer[]>();

/** 共通の乗換候補に、検索で使用済み地点を管理するためのビットを付ける。 */
const getMacroTransfers = (stationId: StationId, fromLineId: LineId): MacroTransfer[] => {
    const cacheKey = `${stationId}:${fromLineId}`;
    const cached = macroTransferCache.get(cacheKey);
    if (cached != null) return cached;
    const transfers = getTransfers(stationId, fromLineId).map((step) => {
        let outsideOpportunityBit = 0;
        if (step.type === 'outside') {
            outsideOpportunityBit =
                step.fromStationId === step.toStationId
                    ? (sameStationOutsideOpportunityBits.get(
                          [stationId, ...[fromLineId, step.toLineId].sort()].join(':'),
                      ) ?? 0)
                    : (crossOutsideOpportunityBits.get(
                          `${step.fromStationId}:${step.fromLineId}:${step.toStationId}:${step.toLineId}`,
                      ) ?? 0);
        }
        return { step, outsideOpportunityBit };
    });
    macroTransferCache.set(cacheKey, transfers);
    return transfers;
};

/** 「開始駅ID:路線ID:着駅ID」から、検索用の駅・乗換地点の集合付き区間を引くキャッシュ。 */
const macroSegmentCache = new Map<string, MacroSegment[]>();

/** 着駅で打ち切った共通乗車区間に、駅の再訪・必須乗換地点の通過の判定用集合を付ける。 */
const getMacroSegments = (
    fromStationId: StationId,
    lineId: LineId,
    destinationStationId: StationId,
): MacroSegment[] => {
    const cacheKey = `${fromStationId}:${lineId}:${destinationStationId}`;
    const cached = macroSegmentCache.get(cacheKey);
    if (cached != null) return cached;
    const segments = getRideSegments(fromStationId, lineId, destinationStationId).map((segment) => ({
        ...segment,
        stationMask: segment.rideSteps.reduce((mask, step) => mask | getStationBit(step.toStationId), BigInt(0)),
        outsideOpportunityMask: segment.rideSteps.reduce(
            (mask, step) => mask | (outsideOpportunityMaskByStation.get(step.toStationId) ?? 0),
            0,
        ),
    }));
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

/** 期限を再確認するまでの主探索の訪問回数。 */
const SEARCH_DEADLINE_CHECK_INTERVAL = 1_000;
/** 一つの乗換回数について候補発見に使う訪問数の上限。 */
const DISCOVERY_VISIT_LIMIT = 125_000;

/** 改札外・改札内乗換の利用条件と検索全体の探索予算。省略した項目は既定値を使う。 */
export type RouteSearchOptions = {
    /** 利用可能な改札外乗換のID。未指定は全地点、空配列・不正なIDはエラー。全選択地点の使用は必須ではない。 */
    outsideTransferIds?: readonly StationId[];
    /** 改札内乗換を候補に含めるか。既定はtrue。運賃計算には影響しない。 */
    includeInsideTransfers?: boolean;
    /** 検索全体で許可する訪問数。 */
    visitLimit?: number;
    /** 前処理を含む検索時間の目安。再帰入口で定期的に確認する。 */
    durationLimitMs?: number;
};

/** 指定回数が1以上かつ公開上限以下の整数かを判定する。 */
export const isValidMaximumOutsideTransferCount = (value: number): boolean =>
    maximumOutsideTransferCountSchema.safeParse(value).success;

/**
 * 発着駅と改札外乗換回数の上限から、発見できた最大回数の経路を最大20件返す。
 * maximumOutsideTransferCountがnullなら、利用可能な改札外乗換地点数を上限にする。
 * optionsで改札外乗換地点の選択、改札内乗換の利用可否、探索予算を指定する。
 * 回数上限・予算・改札外乗換IDが不正、またはIDが空配列ならエラーにする。
 * 上記の入力検証後、発着駅が同じ場合は探索せず、経路なしの確定結果を返す。
 * 探索打ち切り時の候補・最大回数・順位の確定状況はRouteSearchResultを参照する。
 */
export const searchRoutes = (
    originStationId: StationId,
    destinationStationId: StationId,
    maximumOutsideTransferCount: number | null = null,
    options: RouteSearchOptions = {},
): RouteSearchResult => {
    if (maximumOutsideTransferCount != null && !isValidMaximumOutsideTransferCount(maximumOutsideTransferCount)) {
        throw new Error(`最大改札外乗換回数は1〜${MAX_OUTSIDE_TRANSFER_COUNT}回で指定してください`);
    }

    const outsideTransferIds = options.outsideTransferIds ?? allOutsideTransferIds;
    const outsideTransferValidation = outsideTransferIdsSchema.safeParse(outsideTransferIds);
    if (!outsideTransferValidation.success) {
        throw new Error(outsideTransferValidation.error.issues[0].message);
    }
    const selectedOutsideTransferIds = new Set(outsideTransferIds);
    const selectedOutsideMask = outsideOpportunities.reduce(
        (mask, opportunity, index) =>
            selectedOutsideTransferIds.has(opportunity.stationIds[0]) ? mask | (1 << index) : mask,
        0,
    );

    // 検索全体で許可する主探索の訪問数。
    const visitLimit = options.visitLimit ?? SEARCH_VISIT_LIMIT;
    // 前処理を含む検索時間の目安。単位はミリ秒。
    const durationLimitMs = options.durationLimitMs ?? SEARCH_DURATION_LIMIT_MS;
    const includeInsideTransfers = options.includeInsideTransfers ?? true;
    if (!searchBudgetSchema.safeParse({ visitLimit, durationLimitMs }).success) {
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
        selectedOutsideMask &
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
    // 回数ごとに候補と探索位置を保存し、予算追加時に続行する。
    const createTargetSearch = (targetOutsideCount: number) => {
        const results: RouteResult[] = [];
        let targetDeadline = 0;
        let remainingTargetVisitCount = 0;
        let remainingDeadlineCheckCount = 0;
        let complete = false;

        /** 候補を順位順に挿入して上限超過分を除く。 */
        const addResult = (result: RouteResult): void => {
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

        // ジェネレーターの中断により、組合せ・路線・再帰位置と経路スタックを保持する。
        function* explore(): Generator<'budget' | 'candidate', void> {
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
                const visit = function* (
                    stationId: StationId,
                    lineId: LineId,
                    visitedStationMask: bigint,
                    usedOutsideMask: number,
                    insideTransferCount: number,
                    actualDistanceTenths: number,
                ): Generator<'budget' | 'candidate', void> {
                    // 再開時にはrunが新しい予算と期限を設定している。
                    while (
                        remainingTargetVisitCount === 0 ||
                        remainingVisitCount === 0 ||
                        (remainingDeadlineCheckCount === 0 && performance.now() >= targetDeadline)
                    ) {
                        yield 'budget';
                    }
                    if (remainingDeadlineCheckCount === 0) {
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
                    // 固定順序の候補を、未使用の必須地点を含むもの・含まないものの順に走査する。
                    const segments = getMacroSegments(stationId, lineId, destinationStationId);
                    for (let priority = 0; priority < 2; priority += 1) {
                        for (const segment of segments) {
                            const touchedRequiredMask = segment.outsideOpportunityMask & remainingRequiredMask;
                            if (
                                Number(touchedRequiredMask === 0) !== priority ||
                                (visitedStationMask & segment.stationMask) !== BigInt(0)
                            ) {
                                continue;
                            }

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
                                        yield 'candidate';
                                    }
                                }

                                segmentStack.pop();
                                continue;
                            }

                            for (const transfer of getMacroTransfers(segment.toStationId, lineId)) {
                                // 今回選ぶ乗換が改札外乗換か。
                                const isOutside = transfer.step.type === 'outside';

                                if (!includeInsideTransfers && !isOutside) {
                                    continue;
                                }

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
                                yield* visit(
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
                    }
                };

                for (const lineId of stationLineIds.get(originStationId) ?? []) {
                    yield* visit(originStationId, lineId, getStationBit(originStationId), 0, 0, 0);
                }
            }
        }

        const iterator = explore();
        return {
            results,
            get complete() {
                return complete;
            },
            run: (deadline: number, visits: number, stopAtCandidate: boolean): void => {
                if (complete) return;
                targetDeadline = deadline;
                remainingTargetVisitCount = visits;
                remainingDeadlineCheckCount = 0;
                while (true) {
                    const next = iterator.next();
                    if (next.done) {
                        complete = true;
                        return;
                    }
                    if (next.value === 'budget' || stopAtCandidate) return;
                }
            },
        };
    };
    const searches = Array.from({ length: maximumOutsideCount }, (_, index) => createTargetSearch(index + 1));
    // 指定上限を増やしても低い回数の初回予算を減らさない。
    // 全14回の初回探索に時間の半分・訪問数の1/4までを配り、残りを続行に残す。
    const initialDurationMs = Math.max(0, searchDeadline - performance.now()) / (MAX_OUTSIDE_TRANSFER_COUNT * 2);
    const initialVisitLimit = Math.min(
        DISCOVERY_VISIT_LIMIT,
        Math.floor(visitLimit / (MAX_OUTSIDE_TRANSFER_COUNT * 4)),
    );
    for (const search of searches) {
        const targetStart = performance.now();
        search.run(
            Math.min(searchDeadline, targetStart + initialDurationMs),
            Math.min(remainingVisitCount, initialVisitLimit),
            true,
        );
        if (search.results.length > 0) bestRoutes = search.results;
    }
    // 候補未発見の回数へ残り時間を均等に配り、中断位置から続行する。
    // 少ない回数から進め、発見済みの回数以下は以後の候補探索から除く。
    while (remainingVisitCount > 0 && performance.now() < searchDeadline) {
        const bestCount = bestRoutes[0]?.outsideTransferCount ?? 0;
        const pending = searches.filter((search, index) => index + 1 > bestCount && !search.complete);
        if (pending.length === 0) break;
        const roundStart = performance.now();
        // 最大回数の発見を優先する。未確定回数が残れば順位付け前に予算が尽きる場合もある。
        const durationMs = Math.max(0, searchDeadline - roundStart) / pending.length;
        const visits = DISCOVERY_VISIT_LIMIT;
        for (const search of pending) {
            const start = performance.now();
            if (remainingVisitCount === 0 || start >= searchDeadline) break;
            search.run(Math.min(searchDeadline, start + durationMs), Math.min(remainingVisitCount, visits), true);
            if (search.results.length > 0) bestRoutes = search.results;
        }
    }
    const bestSearch = searches[(bestRoutes[0]?.outsideTransferCount ?? 0) - 1];
    bestSearch?.run(searchDeadline, remainingVisitCount, false);
    const truncatedUpperBound = searches.reduce((maximum, search, index) => (search.complete ? maximum : index + 1), 0);

    // 発見できた候補の最大改札外乗換回数。候補がなければ0。
    const bestOutsideCount = bestRoutes[0]?.outsideTransferCount ?? 0;
    return {
        routes: bestRoutes,
        truncated: truncatedUpperBound > 0 && truncatedUpperBound >= bestOutsideCount,
        outsideTransferUpperBound: Math.max(truncatedUpperBound, bestOutsideCount),
    };
};
