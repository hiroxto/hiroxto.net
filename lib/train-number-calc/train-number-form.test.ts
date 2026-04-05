import { describe, expect, it } from 'vitest';
import { getTrainNumberErrorMessage } from './train-number-form';

describe('getTrainNumberErrorMessage', () => {
    it('空文字は許可すること', () => {
        expect(getTrainNumberErrorMessage('')).toBeNull();
    });

    it('正常な列車番号ではエラーにならないこと', () => {
        expect(getTrainNumberErrorMessage('1150')).toBeNull();
    });

    it('先頭0の入力を弾くこと', () => {
        expect(getTrainNumberErrorMessage('0123')).toBe('先頭を0にすることはできません。');
    });

    it('数字以外の入力を弾くこと', () => {
        expect(getTrainNumberErrorMessage('12a')).toBe('列車番号は数字のみで入力してください。');
    });

    it('範囲外の入力を弾くこと', () => {
        expect(getTrainNumberErrorMessage('10000')).toBe('列車番号は1〜9999の範囲で入力してください。');
    });
});
