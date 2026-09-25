import { describe, expect, it } from 'vitest';
import { getTrainNumberErrorMessage } from './train-number-form';

describe('getTrainNumberErrorMessage', () => {
    it('空文字にはエラーメッセージを返さない', () => {
        expect(getTrainNumberErrorMessage('')).toBeNull();
    });

    it('有効な列車番号にはエラーメッセージを返さない', () => {
        expect(getTrainNumberErrorMessage('1150')).toBeNull();
    });

    it('先頭が 0 の番号にはエラーメッセージを返す', () => {
        expect(getTrainNumberErrorMessage('0123')).toBe('先頭を0にすることはできません。');
    });

    it('数字以外を含む入力にはエラーメッセージを返す', () => {
        expect(getTrainNumberErrorMessage('12a')).toBe('列車番号は数字のみで入力してください。');
    });

    it('範囲外の番号にはエラーメッセージを返す', () => {
        expect(getTrainNumberErrorMessage('10000')).toBe('列車番号は1〜9999の範囲で入力してください。');
    });
});
