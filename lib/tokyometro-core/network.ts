/**
 * 東京メトロの共通路線網の仕様。
 * LINE_PATHSの隣接駅を実乗車距離付きで双方向に接続し、同一路線の本線・支線を統合する。
 * 異駅名乗換は定義された路線ペアを双方向に接続する。同駅乗換は駅間グラフには含めない。
 * 同駅の異なる所属路線間は原則改札内とし、マスターデータで指定された例外を適用する。
 * 改札内外の両方が使える場合は改札外を先に返す。徒歩乗換の距離は0として扱う。
 * 検索条件、訪問履歴、探索予算、経路作成の入力状態はこのモジュールでは扱わない。
 * 以下のグラフ・集合は共通マスターから初期化して共有する。呼出側は変更しない。
 */
import {
    CROSS_STATION_TRANSFERS,
    LINE_PATHS,
    type LineId,
    SAME_STATION_INSIDE_AND_OUTSIDE_TRANSFERS,
    SAME_STATION_OUTSIDE_TRANSFERS,
    STATION_NAMES,
    type StationId,
    type TransferType,
} from '@/lib/tokyometro-core/data';

/** 全路線のグラフに登録する、隣接駅への乗車接続。 */
export type RideEdge = {
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

/** 駅データの定義順に並べた全駅ID。 */
export const stationIds = Object.keys(STATION_NAMES) as StationId[];

/** 駅IDをキー、隣接駅への乗車接続・異駅名乗換接続の配列を値とする路線網。距離計算と到達判定に使う。 */
export const graph = new Map<StationId, GraphEdge[]>(stationIds.map((stationId) => [stationId, []]));
/** 駅IDをキー、所属路線IDの集合を値とする対応表。発駅で選べる路線と同駅の乗換先を求める。 */
export const stationLineIds = new Map<StationId, Set<LineId>>(
    stationIds.map((stationId) => [stationId, new Set<LineId>()]),
);
/** 路線ID→駅ID→隣接駅と営業キロ（0.1km単位）の配列という乗車専用グラフ。本線・支線を統合する。 */
export const lineGraphs = new Map<LineId, Map<StationId, LineRideEdge[]>>();

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

/** 改札外乗換可能な同駅の路線ペアの集合。要素は「駅ID:辞書順の路線ID1:路線ID2」で方向を区別しない。 */
const outsideTransferKeys = new Set(
    SAME_STATION_OUTSIDE_TRANSFERS.map(([stationId, firstLineId, secondLineId]) =>
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
    ),
);

/** 改札内外の両方を選択できる同駅の路線ペアの集合。要素は「駅ID:辞書順の路線ID1:路線ID2」。 */
const insideAndOutsideTransferKeys = new Set(
    SAME_STATION_INSIDE_AND_OUTSIDE_TRANSFERS.map(([stationId, firstLineId, secondLineId]) =>
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
    ),
);

/** 同駅の路線ペアに許可する乗換種別を返す。両方使える場合は改札外を先にする。 */
export const getSameStationTransferTypes = (
    stationId: StationId,
    fromLineId: LineId,
    toLineId: LineId,
): TransferType[] => {
    // 方向を区別しない駅・路線ペアの照合キー。
    const key = [stationId, ...[fromLineId, toLineId].sort()].join(':');
    if (insideAndOutsideTransferKeys.has(key)) return ['outside', 'inside'];
    return outsideTransferKeys.has(key) ? ['outside'] : ['inside'];
};

/** 複数路線が所属する駅と異駅名乗換の両端駅。乗車区間の終点候補に使う。 */
export const transferStationIds = new Set<StationId>([
    ...[...stationLineIds].filter(([, lineIds]) => lineIds.size > 1).map(([stationId]) => stationId),
    ...CROSS_STATION_TRANSFERS.flatMap(({ fromStationId, toStationId }) => [fromStationId, toStationId]),
]);
