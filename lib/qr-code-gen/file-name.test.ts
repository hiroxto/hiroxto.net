import { describe, expect, it } from 'vitest';
import { buildQrCodeFileName } from './file-name';

describe('buildQrCodeFileName', () => {
    it('1桁の月・日・時・分・秒を0埋めしたローカル時刻と拡張子でファイル名を作る', () => {
        const date = new Date(2026, 0, 2, 3, 4, 5);

        expect(buildQrCodeFileName(date, 'png')).toBe('qrcode-20260102-030405.png');
        expect(buildQrCodeFileName(date, 'svg')).toBe('qrcode-20260102-030405.svg');
    });

    it('2桁の月・日と24時間表記の時刻でファイル名を作る', () => {
        expect(buildQrCodeFileName(new Date(2026, 11, 31, 23, 59, 59), 'png')).toBe('qrcode-20261231-235959.png');
    });
});
