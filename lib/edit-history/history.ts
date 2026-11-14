/**
 * 現在の入力全体を一単位として復元する、非永続の編集履歴。
 * 同じgroupの連続変更だけをまとめる。null・Undo・Redoでまとめを終了し、
 * 同値の変更では履歴とRedoを保持する。新しい変更ではRedoを破棄する。
 * 同じgroupで開始値に戻ったときは、その履歴だけを除き、次の入力を新しいgroupとして扱う。
 */
export interface EditHistory<T> {
    past: T[];
    present: T;
    future: T[];
    group: string | null;
}

export const createHistory = <T>(present: T): EditHistory<T> => ({ past: [], present, future: [], group: null });

export const recordEdit = <T>(history: EditHistory<T>, next: T, group: string | null = null): EditHistory<T> => {
    if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
    const continuing = group != null && group === history.group;
    if (continuing && JSON.stringify(history.past.at(-1)) === JSON.stringify(next)) {
        return { past: history.past.slice(0, -1), present: next, future: [], group: null };
    }
    return {
        past: continuing ? history.past : [...history.past, history.present],
        present: next,
        future: [],
        group,
    };
};

export const undoEdit = <T>(history: EditHistory<T>): EditHistory<T> => {
    if (history.past.length === 0) return history;
    return {
        past: history.past.slice(0, -1),
        present: history.past[history.past.length - 1],
        future: [history.present, ...history.future],
        group: null,
    };
};

export const redoEdit = <T>(history: EditHistory<T>): EditHistory<T> => {
    if (history.future.length === 0) return history;
    return {
        past: [...history.past, history.present],
        present: history.future[0],
        future: history.future.slice(1),
        group: null,
    };
};
