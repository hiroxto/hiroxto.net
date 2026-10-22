import { LINE_DEFINITIONS, type LineId } from '@/lib/tokyometro-core/data';

/** 0.1km単位の整数を、小数点以下1桁のkm表記へ変換する。 */
export const formatDistance = (distanceTenths: number): string => `${(distanceTenths / 10).toFixed(1)}km`;

/** 路線IDに対応する表示名を返す。 */
export const getLineLabel = (lineId: LineId): string => LINE_DEFINITIONS[lineId].name;
