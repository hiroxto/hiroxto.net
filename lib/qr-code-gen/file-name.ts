import { format } from 'date-fns';

export type QrCodeFileExtension = 'png' | 'svg';

/**
 * ダウンロードするQRコードのファイル名を作る。
 * 形式は `qrcode-yyyyMMdd-HHmmss.<拡張子>` とし、日時は実行環境のローカル時刻で表す。
 */
export const buildQrCodeFileName = (date: Date, extension: QrCodeFileExtension): string =>
    `qrcode-${format(date, 'yyyyMMdd-HHmmss')}.${extension}`;
