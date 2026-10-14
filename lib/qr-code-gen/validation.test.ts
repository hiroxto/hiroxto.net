import { describe, expect, it } from 'vitest';
import { getQrCodeValidationError } from './validation';

describe('getQrCodeValidationError', () => {
    it.each([
        ['L', 7089, 4296, 2953],
        ['M', 5596, 3391, 2331],
        ['Q', 3993, 2420, 1663],
        ['H', 3057, 1852, 1273],
    ] as const)(
        'レベル%sの数字・英数字・バイトの上限を許可し、超過を拒否する',
        (level, numeric, alphanumeric, bytes) => {
            expect(getQrCodeValidationError('1'.repeat(numeric), level)).toBeNull();
            expect(getQrCodeValidationError('1'.repeat(numeric + 1), level)).not.toBeNull();
            expect(getQrCodeValidationError('A'.repeat(alphanumeric), level)).toBeNull();
            expect(getQrCodeValidationError('A'.repeat(alphanumeric + 1), level)).not.toBeNull();
            expect(getQrCodeValidationError('a'.repeat(bytes), level)).toBeNull();
            expect(getQrCodeValidationError('a'.repeat(bytes + 1), level)).not.toBeNull();
        },
    );

    it('日本語と絵文字はUTF-8のバイト数で容量を判定する', () => {
        expect(getQrCodeValidationError(`${'あ'.repeat(424)}a`, 'H')).toBeNull();
        expect(getQrCodeValidationError('あ'.repeat(425), 'H')).not.toBeNull();
        expect(getQrCodeValidationError(`${'😀'.repeat(318)}a`, 'H')).toBeNull();
        expect(getQrCodeValidationError('😀'.repeat(319), 'H')).not.toBeNull();
    });

    it('小文字や改行が含まれる場合は英数字モードの上限を使わない', () => {
        expect(getQrCodeValidationError(`${'A'.repeat(1273)}a`, 'H')).not.toBeNull();
        expect(getQrCodeValidationError(`${'A'.repeat(1273)}\n`, 'H')).not.toBeNull();
    });

    it('空文字は許可し、不完全なサロゲートは拒否する', () => {
        expect(getQrCodeValidationError('', 'H')).toBeNull();
        expect(getQrCodeValidationError('\ud800', 'H')).not.toBeNull();
    });
});
