/**
 * 乗車区間・乗換候補の共通仕様。
 * 同一路線で駅を再訪せずに進み、乗換可能駅または指定した着駅で終わる区間を列挙する。
 * 着駅での打ち切りは既定で有効。無効にした場合は着駅より先の区間も返す。
 * 区間は実乗車距離、終点駅IDの順。乗換は改札外を先に、乗換先路線ID、駅IDの順とする。
 * 入力済み経路や検索条件による候補の除外は呼出側で行う。
 * 列挙結果は条件別に共有する。呼出側は返された配列と要素を変更しない。
 */
import { CROSS_STATION_TRANSFERS, type LineId, type StationId } from '@/lib/tokyometro-core/data';
import {
    getSameStationTransferTypes,
    lineGraphs,
    stationLineIds,
    transferStationIds,
} from '@/lib/tokyometro-core/network';
import type { RideStep, RouteLeg, TransferStep } from '@/lib/tokyometro-core/types';

/** 連続した乗車区間と、経路順に並ぶ隣接駅間の乗車記録。 */
export type RideSegment = RouteLeg & { rideSteps: RideStep[] };

/** 「現在駅ID:乗車中の路線ID」から、方向付きの乗換一覧を引く共通キャッシュ。 */
const transferCache = new Map<string, TransferStep[]>();

/** 同駅・異駅名の乗換を両方向の定義から求め、改札外を優先して返す。 */
export const getTransfers = (stationId: StationId, fromLineId: LineId): TransferStep[] => {
    const cacheKey = `${stationId}:${fromLineId}`;
    const cached = transferCache.get(cacheKey);
    if (cached != null) return cached;
    const transfers: TransferStep[] = [];
    for (const toLineId of stationLineIds.get(stationId) ?? []) {
        if (toLineId === fromLineId) continue;
        for (const type of getSameStationTransferTypes(stationId, fromLineId, toLineId)) {
            transfers.push({
                kind: 'transfer',
                fromStationId: stationId,
                toStationId: stationId,
                fromLineId,
                toLineId,
                type,
            });
        }
    }
    for (const connection of CROSS_STATION_TRANSFERS) {
        const isForward = connection.fromStationId === stationId;
        const isBackward = connection.toStationId === stationId;
        if (!isForward && !isBackward) continue;
        for (const [firstLineId, secondLineId] of connection.linePairs) {
            const expectedFromLineId = isForward ? firstLineId : secondLineId;
            if (expectedFromLineId !== fromLineId) continue;
            transfers.push({
                kind: 'transfer',
                fromStationId: stationId,
                toStationId: isForward ? connection.toStationId : connection.fromStationId,
                fromLineId,
                toLineId: isForward ? secondLineId : firstLineId,
                type: connection.type,
            });
        }
    }
    transfers.sort(
        (first, second) =>
            Number(second.type === 'outside') - Number(first.type === 'outside') ||
            first.toLineId.localeCompare(second.toLineId) ||
            first.toStationId.localeCompare(second.toStationId),
    );
    transferCache.set(cacheKey, transfers);
    return transfers;
};

/** 「開始駅ID:路線ID:着駅ID:着駅での打ち切り有無」をキーに乗車区間を保存する。訪問履歴による除外は主探索で行う。 */
const rideSegmentCache = new Map<string, RideSegment[]>();

/**
 * 同一路線のグラフを深さ優先でたどり、乗換駅または着駅までの乗車区間を列挙する。
 * 途中の乗換駅は通過も認める。stopAtDestinationがtrueなら着駅で延長を止める。
 * falseなら着駅を通り越す区間も列挙する。区間内での駅の再訪は禁止する。
 */
export const getRideSegments = (
    fromStationId: StationId,
    lineId: LineId,
    destinationStationId: StationId,
    stopAtDestination = true,
): RideSegment[] => {
    // 計算結果を再利用するための入力条件のキー。
    const cacheKey = `${fromStationId}:${lineId}:${destinationStationId}:${stopAtDestination}`;
    // 同じ条件で計算済みの値。存在すれば再計算を省く。
    const cached = rideSegmentCache.get(cacheKey);

    if (cached != null) {
        return cached;
    }

    // 処理対象の路線に属する乗車接続。
    const lineGraph = lineGraphs.get(lineId);

    if (lineGraph == null) {
        return [];
    }

    // 同一路線を乗り続けて到達する乗車区間の一覧。
    const segments: RideSegment[] = [];
    // 現在組み立てている乗車区間内の訪問済み駅。戻る際に取り消す。
    const visitedStations = new Set<StationId>([fromStationId]);
    // 現在組み立てている区間の隣接駅間の乗車記録。
    const rideSteps: RideStep[] = [];

    /**
     * 同一路線の乗車区間を再帰的に延長する。候補に保存するときは乗車記録を複製する。
     * distanceTenthsは開始駅から現在駅までの累積実乗車距離。再帰後に訪問履歴と記録を戻す。
     */
    const visit = (stationId: StationId, distanceTenths: number): void => {
        if (stationId !== fromStationId && (stationId === destinationStationId || transferStationIds.has(stationId))) {
            segments.push({
                fromStationId,
                toStationId: stationId,
                lineId,
                rideSteps: [...rideSteps],
                distanceTenths,
            });
        }

        if (stationId === destinationStationId && stopAtDestination) {
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
            visit(edge.stationId, distanceTenths + edge.distanceTenths);
            rideSteps.pop();
            visitedStations.delete(edge.stationId);
        }
    };

    visit(fromStationId, 0);
    // 距離・駅IDの順序は訪問履歴や必須乗換地点に依存しない。
    segments.sort(
        (first, second) =>
            first.distanceTenths - second.distanceTenths || first.toStationId.localeCompare(second.toStationId),
    );
    rideSegmentCache.set(cacheKey, segments);
    return segments;
};
