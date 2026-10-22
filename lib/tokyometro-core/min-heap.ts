/**
 * 比較関数で最小となる要素を取り出す二分ヒープの仕様。
 * compare(a, b)が負ならaを優先し、pushで追加、popで最小要素を削除して返す。
 * 空のpopはundefined。同順位の取り出し順は保証しない。追加・取り出しはO(log n)。
 */
export const createMinHeap = <T>(compare: (first: T, second: T) => number) => {
    const values: T[] = [];

    const push = (value: T): void => {
        let index = values.length;
        values.push(value);
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (compare(values[parent], value) <= 0) break;
            values[index] = values[parent];
            index = parent;
        }
        values[index] = value;
    };

    const pop = (): T | undefined => {
        if (values.length === 0) return undefined;
        const minimum = values[0];
        const last = values[values.length - 1];
        values.pop();
        if (values.length === 0) return minimum;

        let index = 0;
        while (index * 2 + 1 < values.length) {
            let child = index * 2 + 1;
            if (child + 1 < values.length && compare(values[child + 1], values[child]) < 0) child += 1;
            if (compare(last, values[child]) <= 0) break;
            values[index] = values[child];
            index = child;
        }
        values[index] = last;
        return minimum;
    };

    return { push, pop };
};
