/**
 * 駅選択・検証の共通仕様。
 * 駅一覧はSTATION_NAMESの定義順を維持し、所属路線はLINE_PATHSの登録順に重複なく並べる。
 * 駅IDはSTATION_NAMESに登録されたキーだけを受け付ける。発着駅の組合せは各機能で検証する。
 * 同じ駅IDと、CROSS_STATION_TRANSFERSの異駅名乗換駅同士は同一駅として扱う。
 */
import { z } from 'zod';
import { CROSS_STATION_TRANSFERS, STATION_NAMES, type StationId } from '@/lib/tokyometro-core/data';
import { stationIds, stationLineIds } from '@/lib/tokyometro-core/network';
import type { StationOption } from '@/lib/tokyometro-core/types';

/** マスターに登録された駅IDだけを許可する共通の検証規則。 */
export const stationIdSchema = z.enum(Object.keys(STATION_NAMES) as StationId[], {
    error: '指定された駅が見つかりません',
});

/** 駅選択用の{id: 駅ID, name: 日本語駅名, lineIds: 所属路線ID配列}の一覧。駅データの定義順を維持する。 */
export const stations: StationOption[] = stationIds.map((id) => ({
    id,
    name: STATION_NAMES[id],
    lineIds: [...(stationLineIds.get(id) ?? [])],
}));

/** 文字列が登録済みの駅IDかを判定し、型を絞り込む。 */
export const isStationId = (value: string): value is StationId => stationIdSchema.safeParse(value).success;

/**
 * 同じ駅ID、または異駅名乗換の両端駅かを方向によらず判定する。未指定の駅は対象外。
 * 異駅名の組合せは旅客営業規程第45条第2項の乗換駅一覧に対応する。
 * https://www.tokyometro.jp/ticket/terms/pdf/ryokyaku_eigyo_260119.pdf
 */
export const isSameStation = (first: StationId | null, second: StationId | null): boolean =>
    first != null &&
    second != null &&
    (first === second ||
        CROSS_STATION_TRANSFERS.some(
            ({ fromStationId, toStationId }) =>
                (first === fromStationId && second === toStationId) ||
                (first === toStationId && second === fromStationId),
        ));
