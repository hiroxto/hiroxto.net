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

    it('通常の専貨は千の位が0・1・3〜5の番号だけを判定する', () => {
        expect(calcTrainNumberType('160')).toBe('専貨A');
        expect(calcTrainNumberType('190')).toBe('専貨B');
        expect(calcTrainNumberType('1160')).toBe('専貨A');
        expect(calcTrainNumberType('3160')).toBe('専貨A');
        expect(calcTrainNumberType('4160')).toBe('専貨A');
        expect(calcTrainNumberType('5190')).toBe('専貨B');
        expect(calcTrainNumberType('2160')).toBeNull();
        expect(calcTrainNumberType('2190')).toBeNull();
        expect(calcTrainNumberType('2150')).toBeNull();
    });

    it('千の位が6〜7の季節貨物列車を下位桁の条件で判定する', () => {
        expect(calcTrainNumberType('6050')).toBe('高速貨A');
        expect(calcTrainNumberType('7070')).toBe('高速貨B');
        expect(calcTrainNumberType('6150')).toBe('高速貨C');
        expect(calcTrainNumberType('7159')).toBe('高速貨C');
        expect(calcTrainNumberType('6160')).toBe('専貨A');
        expect(calcTrainNumberType('7190')).toBe('専貨B');
    });

    it('千の位が8〜9の臨時貨物列車を下位桁の条件で判定する', () => {
        expect(calcTrainNumberType('8150')).toBe('臨高速貨C');
        expect(calcTrainNumberType('9159')).toBe('臨高速貨C');
        expect(calcTrainNumberType('8160')).toBe('臨専貨A');
        expect(calcTrainNumberType('9190')).toBe('臨専貨B');
    });

    it.each(['', '0', '0001', 'A12', '12 ', '10000', '1.5', '-1', '１２', '1e2'])(
        '不正な列車番号「%s」では種別を返さない',
        (value) => {
            expect(calcTrainNumberType(value)).toBeNull();
        },
    );
});
