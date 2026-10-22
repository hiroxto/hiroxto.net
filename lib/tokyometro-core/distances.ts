/**
 * 最短距離計算の共通仕様。
 * 距離は0.1km単位の整数とし、実乗車距離と運賃計算距離を別々に計算・保存する。
 * 異駅名の徒歩乗換は距離0とするが、別駅への最短運賃計算距離が徒歩だけで0になる場合は
 * 起点からその駅への直接徒歩接続を除いて再計算する。実乗車距離にはこの補正を適用しない。
 * 乗換地点の選択条件、路線の接続制約、駅の再訪制限は適用しない。到達不能な駅はInfinity。
 * 起点ごとの結果はモジュール内で共有する。呼出側は返されたMapを変更しない。
 */
import { FARE_CALCULATION_DISTANCE_OVERRIDES, type StationId } from '@/lib/tokyometro-core/data';
import { createMinHeap } from '@/lib/tokyometro-core/min-heap';
import { graph, type RideEdge, stationIds } from '@/lib/tokyometro-core/network';

/** 駅IDを辞書順に並べ、往復で共通の駅間キーを作る。 */
const getStationPairKey = (firstStationId: StationId, secondStationId: StationId): string =>
    firstStationId < secondStationId ? `${firstStationId}:${secondStationId}` : `${secondStationId}:${firstStationId}`;

/** 「辞書順の駅ID1:駅ID2」をキー、運賃計算距離（0.1km単位）を値とする補正表。往復で同じ値を使う。 */
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
export const getShortestActualDistances = (originStationId: StationId): Map<StationId, number> => {
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
export const getShortestFareDistances = (originStationId: StationId): Map<StationId, number> => {
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
