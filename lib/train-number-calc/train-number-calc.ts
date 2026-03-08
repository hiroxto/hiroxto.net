import type { TrainNumberType } from './train-number-type';

export const calcTrainNumberType = (trainNumber: string): TrainNumberType | null => {
    const splitNumber = convertToSplitNumber(trainNumber);

    if (
        trainNumber === '' ||
        splitNumber.includes(Number.NaN) ||
        splitNumber.length !== 4 ||
        trainNumber.startsWith('0')
    ) {
        return null;
    }

    return isPassengerNumber(splitNumber) ? getPassengerType(splitNumber) : getFreightType(splitNumber);
};

const getPassengerType = (splitNumber: number[]): TrainNumberType | null => {
    if (!isPassengerNumber(splitNumber)) {
        return null;
    }

    const isSpecial = isPassengerSpecialNumber(splitNumber);

    if (splitNumber[1] === 0) {
        return isSpecial ? '臨特急客' : '特急客';
    }

    if ((splitNumber[0] !== 0 || splitNumber[1] !== 0) && splitNumber[2] <= 1) {
        return isSpecial ? '臨急客' : '急客';
    }

    if (splitNumber[1] !== 0 && splitNumber[2] >= 2) {
        return isSpecial ? '臨客' : '客';
    }

    return null;
};

const getFreightType = (splitNumber: number[]): TrainNumberType | null => {
    if (!isFreightNumber(splitNumber)) {
        return null;
    }

    const isSpecial = isFreightSpecialNumber(splitNumber);

    if (splitNumber[1] === 0) {
        return splitNumber[2] <= 6
            ? isSpecial
                ? '臨高速貨A'
                : '高速貨A'
            : isSpecial
              ? '臨高速貨B'
              : '高速貨B';
    }

    if ((splitNumber[0] <= 1 || isSpecial) && splitNumber[2] === 5) {
        return isSpecial ? '臨高速貨C' : '高速貨C';
    }

    if (splitNumber[2] >= 6 && splitNumber[2] <= 8) {
        return isSpecial ? '臨専貨A' : '専貨A';
    }

    if (splitNumber[2] === 9) {
        return isSpecial ? '臨専貨B' : '専貨B';
    }

    return null;
};

const isPassengerNumber = (splitNumber: number[]): boolean => {
    return splitNumber[2] <= 4;
};

const isFreightNumber = (splitNumber: number[]): boolean => {
    return splitNumber[2] >= 5;
};

const isPassengerSpecialNumber = (splitNumber: number[]): boolean => {
    return isPassengerNumber(splitNumber) && splitNumber[0] >= 6;
};

const isFreightSpecialNumber = (splitNumber: number[]): boolean => {
    return isFreightNumber(splitNumber) && splitNumber[0] >= 8;
};

const convertToSplitNumber = (trainNumber: string): number[] => {
    return trainNumber
        .toString()
        .padStart(4, '0')
        .split('')
        .map((value) => Number.parseInt(value, 10));
};
