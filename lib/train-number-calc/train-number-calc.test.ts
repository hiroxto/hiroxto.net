import { describe, expect, it } from 'vitest';
import { TrainNumberCalc } from './train-number-calc';

describe('TrainNumberCalc', () => {
    it('旅客列車の種別を計算できる', () => {
        expect(new TrainNumberCalc('1').calc()).toBe('特急客');
        expect(new TrainNumberCalc('2022').calc()).toBe('特急客');
        expect(new TrainNumberCalc('6010').calc()).toBe('臨特急客');
    });

    it('貨物列車の種別を計算できる', () => {
        expect(new TrainNumberCalc('5094').calc()).toBe('高速貨B');
        expect(new TrainNumberCalc('8050').calc()).toBe('臨高速貨A');
        expect(new TrainNumberCalc('1860').calc()).toBe('専貨A');
        expect(new TrainNumberCalc('1990').calc()).toBe('専貨B');
        expect(new TrainNumberCalc('9011').calc()).toBe('臨特急客');
    });

    it('境界値を正しく判定できる', () => {
        expect(new TrainNumberCalc('49').calc()).toBe('特急客');
        expect(new TrainNumberCalc('50').calc()).toBe('高速貨A');
        expect(new TrainNumberCalc('69').calc()).toBe('高速貨A');
        expect(new TrainNumberCalc('70').calc()).toBe('高速貨B');
        expect(new TrainNumberCalc('159').calc()).toBe('高速貨C');
        expect(new TrainNumberCalc('160').calc()).toBe('専貨A');
        expect(new TrainNumberCalc('190').calc()).toBe('専貨B');
    });

    it('不正入力は null を返す', () => {
        expect(new TrainNumberCalc('').calc()).toBeNull();
        expect(new TrainNumberCalc('0001').calc()).toBeNull();
        expect(new TrainNumberCalc('A12').calc()).toBeNull();
    });
});
