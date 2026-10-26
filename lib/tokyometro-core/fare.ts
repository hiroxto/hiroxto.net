/**
 * 運賃計算の共通仕様。
 * 最短運賃計算距離をkm単位へ切り上げ、最低1kmとして距離帯運賃を適用する。
 * 綾瀬―北千住の相互発着と南北線共用区間内の相互発着には特定運賃を優先する。
 * 経路全体の運賃は、着駅と各改札外出場駅への運賃の最大値をIC・きっぷ別に採用する。
 * 同じ駅IDまたは異駅名乗換駅同士の発着は同一駅として計算を拒否する。
 * 実際に乗車する距離や経路の完成状態とは独立して計算する。
 */
import type { StationId } from '@/lib/tokyometro-core/data';
import { getShortestFareDistances } from '@/lib/tokyometro-core/distances';
import { isSameStation } from '@/lib/tokyometro-core/stations';
import type { Fare, RouteResult, RouteTransfer } from '@/lib/tokyometro-core/types';

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

    // 南北線共用区間の駅ID集合。発着両方がこの集合に含まれる場合はIC178円・きっぷ180円を適用する。
    const sharedNambokuSection = new Set<StationId>(['meguro', 'shirokanedai', 'shirokane-takanawa']);

    if (sharedNambokuSection.has(originStationId) && sharedNambokuSection.has(destinationStationId)) {
        return { ic: 178, ticket: 180 };
    }

    return getRegularFare(distanceTenths);
};

/**
 * 発着駅間の最短運賃計算距離と運賃を返す。到達可能な経路がない場合はエラーにする。
 * 途中の改札外出場駅は考慮しない。経路ごとの運賃はcalculateRouteFareで求める。
 */
export const calculateFareBetweenStations = (
    originStationId: StationId,
    destinationStationId: StationId,
): Fare & { shortestDistanceTenths: number } => {
    if (isSameStation(originStationId, destinationStationId)) {
        throw new Error('乗車駅と降車駅には異なる駅を指定してください');
    }
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

/**
 * 着駅と各改札外出場駅への運賃の最大値をIC・きっぷ別に返す。改札外乗換0回でも計算する。
 * 異駅名乗換は出場側の駅を確認する。確認結果は経路順を維持し、同じ駅への出場も省略しない。
 * shortestDistancesは発駅からの最短運賃計算距離。省略時は共通キャッシュから取得する。
 * 検索条件による乗換地点の制限は運賃計算には適用しない。
 */
export const calculateRouteFare = (
    originStationId: StationId,
    destinationStationId: StationId,
    transfers: RouteTransfer[],
    shortestDistances = getShortestFareDistances(originStationId),
): Pick<RouteResult, 'shortestDistanceTenths' | 'fare' | 'fareCheckpoints'> => {
    if (isSameStation(originStationId, destinationStationId)) {
        throw new Error('乗車駅と降車駅には異なる駅を指定してください');
    }
    // 発駅から着駅までの最短運賃計算距離。単位は0.1km。
    const shortestDistanceTenths = shortestDistances.get(destinationStationId) ?? Number.POSITIVE_INFINITY;
    // 途中出場を考慮する前の、発着駅間の運賃。
    const baseFare = getFare(originStationId, destinationStationId, shortestDistanceTenths);
    // 各改札外出場駅までの運賃確認結果。
    const fareCheckpoints = transfers
        .filter((transfer) => transfer.type === 'outside')
        .map((transfer) => {
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

    return { shortestDistanceTenths, fare, fareCheckpoints };
};
