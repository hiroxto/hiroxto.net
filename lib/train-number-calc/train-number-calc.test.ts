import { describe, expect, it } from 'vitest';
import { calcTrainNumberType } from './train-number-calc';

describe('calcTrainNumberType', () => {
    it('旅客列車の番号から列車種別を返す', () => {
        expect(calcTrainNumberType('1')).toBe('特急客');
        expect(calcTrainNumberType('2022')).toBe('特急客');
        expect(calcTrainNumberType('6010')).toBe('臨特急客');
    });

    it('貨物列車と臨時旅客列車の番号から列車種別を返す', () => {
        expect(calcTrainNumberType('5094')).toBe('高速貨B');
        expect(calcTrainNumberType('8050')).toBe('臨高速貨A');
        expect(calcTrainNumberType('1860')).toBe('専貨A');
        expect(calcTrainNumberType('1990')).toBe('専貨B');
        expect(calcTrainNumberType('9011')).toBe('臨特急客');
    });

    it('種別が切り替わる境界の番号を判定する', () => {
        expect(calcTrainNumberType('49')).toBe('特急客');
        expect(calcTrainNumberType('50')).toBe('高速貨A');
        expect(calcTrainNumberType('69')).toBe('高速貨A');
        expect(calcTrainNumberType('70')).toBe('高速貨B');
        expect(calcTrainNumberType('159')).toBe('高速貨C');
        expect(calcTrainNumberType('160')).toBe('専貨A');
        expect(calcTrainNumberType('190')).toBe('専貨B');
        expect(calcTrainNumberType('6101')).toBe('臨急客');
        expect(calcTrainNumberType('6222')).toBe('臨客');
    });

    it('空文字・先頭ゼロ・数字以外・範囲外の入力には null を返す', () => {
        expect(calcTrainNumberType('')).toBeNull();
        expect(calcTrainNumberType('0')).toBeNull();
        expect(calcTrainNumberType('0001')).toBeNull();
        expect(calcTrainNumberType('A12')).toBeNull();
        expect(calcTrainNumberType('12 ')).toBeNull();
        expect(calcTrainNumberType('10000')).toBeNull();
    });
});
