import { describe, expect, test } from 'vitest';
import { createHistory, recordEdit, redoEdit, undoEdit } from './history';

describe('編集履歴', () => {
    test('連続する同じ欄の入力をまとめ、別操作・Undo・Redoで区切る', () => {
        let history = createHistory({ text: '', count: 0 });
        history = recordEdit(history, { text: '東', count: 0 }, 'text');
        history = recordEdit(history, { text: '東京', count: 0 }, 'text');
        history = recordEdit(history, { text: '東京', count: 1 });
        expect(undoEdit(history).present).toEqual({ text: '東京', count: 0 });
        expect(undoEdit(undoEdit(history)).present).toEqual({ text: '', count: 0 });
        expect(redoEdit(redoEdit(undoEdit(undoEdit(history)))).present).toEqual({ text: '東京', count: 1 });
    });
    test('同値の変更と履歴がないUndo/Redoでは状態を変更しない', () => {
        const initial = createHistory({ text: '' });
        expect(undoEdit(initial)).toBe(initial);
        expect(redoEdit(initial)).toBe(initial);
        const undone = undoEdit(recordEdit(initial, { text: '東京' }));
        expect(recordEdit(undone, { text: '' })).toBe(undone);
        expect(recordEdit(undone, { text: '大阪' }).future).toEqual([]);
    });
});
