import type { TrainNumberType } from './train-number-type';

/**
 * 列車番号から列車種別を計算するクラス
 */
export class TrainNumberCalc {
    /**
     * 計算する列車番号
     */
    protected trainNumber: string;

    /**
     * 列車番号を1文字ずつに分割した値
     * 4桁より少ない場合、頭を0で埋める
     */
    protected splitNumber: number[];

    constructor(trainNumber: string) {
        this.trainNumber = trainNumber;
        this.splitNumber = this.convertToSplitNumber();
    }

    calc(): TrainNumberType | null {
        if (
            this.trainNumber === '' ||
            this.splitNumber.includes(Number.NaN) ||
            this.splitNumber.length !== 4 ||
            this.trainNumber.startsWith('0')
        ) {
            return null;
        }

        return this.isPassengerNumber() ? this.getPassengerType() : this.getFreightType();
    }

    private getPassengerType(): TrainNumberType | null {
        if (!this.isPassengerNumber()) {
            return null;
        }

        const isSpecial = this.isPassengerSpecialNumber();

        if (this.splitNumber[1] === 0) {
            return isSpecial ? '臨特急客' : '特急客';
        }

        if ((this.splitNumber[0] !== 0 || this.splitNumber[1] !== 0) && this.splitNumber[2] <= 1) {
            return isSpecial ? '臨急客' : '急客';
        }

        if (this.splitNumber[1] !== 0 && this.splitNumber[2] >= 2) {
            return isSpecial ? '臨客' : '客';
        }

        return null;
    }

    private getFreightType(): TrainNumberType | null {
        if (!this.isFreightNumber()) {
            return null;
        }

        const isSpecial = this.isFreightSpecialNumber();

        if (this.splitNumber[1] === 0) {
            return this.splitNumber[2] <= 6
                ? isSpecial
                    ? '臨高速貨A'
                    : '高速貨A'
                : isSpecial
                  ? '臨高速貨B'
                  : '高速貨B';
        }

        if ((this.splitNumber[0] <= 1 || isSpecial) && this.splitNumber[2] === 5) {
            return isSpecial ? '臨高速貨C' : '高速貨C';
        }

        if (this.splitNumber[2] >= 6 && this.splitNumber[2] <= 8) {
            return isSpecial ? '臨専貨A' : '専貨A';
        }

        if (this.splitNumber[2] === 9) {
            return isSpecial ? '臨専貨B' : '専貨B';
        }

        return null;
    }

    isPassengerNumber(): boolean {
        return this.splitNumber[2] <= 4;
    }

    isFreightNumber(): boolean {
        return this.splitNumber[2] >= 5;
    }

    isPassengerSpecialNumber(): boolean {
        return this.isPassengerNumber() && this.splitNumber[0] >= 6;
    }

    isFreightSpecialNumber(): boolean {
        return this.isFreightNumber() && this.splitNumber[0] >= 8;
    }

    private convertToSplitNumber(): number[] {
        return this.trainNumber
            .toString()
            .padStart(4, '0')
            .split('')
            .map((value) => Number.parseInt(value, 10));
    }
}
