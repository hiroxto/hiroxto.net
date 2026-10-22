import type { LineId, StationId, TransferType } from '@/lib/tokyometro-core/data';

/** 経路を構成する、隣接駅間の1回の乗車。 */
export type RideStep = {
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
export type TransferStep = {
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
export type TraversalStep = RideStep | TransferStep;

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

/** 駅選択に使う駅ID、表示名、利用可能な路線。 */
export type StationOption = {
    /** 駅選択の値に使う駅ID。 */
    id: StationId;
    /** 駅の表示名。 */
    name: string;
    /** 駅で利用できる路線ID。 */
    lineIds: LineId[];
};
