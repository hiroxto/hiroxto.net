import { z } from 'zod';

const qrCodeErrorCorrectionLevelSchema = z.enum(['L', 'M', 'Q', 'H']);

export type QrCodeErrorCorrectionLevel = z.infer<typeof qrCodeErrorCorrectionLevelSchema>;

/**
 * QRコードのバージョン40で格納できる最大容量。
 * https://www.qrcode.com/en/about/version.html
 * qrcode.reactへ単一文字列を渡す場合と同じく、数字、英数字、UTF-8バイトの順でモードを判定する。
 * 英数字は数字・英大文字・空白・$%*+-./:に限る。漢字モードは使用しない。
 * 数字・英数字は文字数、バイトモードはUTF-8のバイト数を上限と比較する。
 */
const maximumCapacity = {
    L: { numeric: 7089, alphanumeric: 4296, bytes: 2953 },
    M: { numeric: 5596, alphanumeric: 3391, bytes: 2331 },
    Q: { numeric: 3993, alphanumeric: 2420, bytes: 1663 },
    H: { numeric: 3057, alphanumeric: 1852, bytes: 1273 },
} as const;

export const qrCodeSchema = z
    .object({
        value: z.string().refine((value) => value.isWellFormed(), '入力に不正な文字が含まれています。'),
        level: qrCodeErrorCorrectionLevelSchema,
    })
    .refine(
        ({ value, level }) => {
            const capacity = maximumCapacity[level];
            if (/^[0-9]*$/.test(value)) {
                return value.length <= capacity.numeric;
            }
            if (/^[A-Z0-9 $%*+./:-]*$/.test(value)) {
                return value.length <= capacity.alphanumeric;
            }
            return new TextEncoder().encode(value).length <= capacity.bytes;
        },
        {
            path: ['value'],
            message: '入力内容がQRコードの容量を超えています。文字数を減らすか、誤り訂正レベルを下げてください。',
        },
    );

export const getQrCodeValidationError = (value: string, level: QrCodeErrorCorrectionLevel): string | null => {
    const parseResult = qrCodeSchema.safeParse({ value, level });
    if (parseResult.success) {
        return null;
    }
    return parseResult.error.issues[0].message;
};
