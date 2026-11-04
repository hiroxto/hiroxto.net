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
    test('同じ欄で開始値に戻すと古い履歴だけ残り、続けた入力も一操作になる', () => {
        let history = recordEdit(createHistory({ text: '', count: 0 }), { text: '', count: 1 });
        history = recordEdit(history, { text: '東', count: 1 }, 'text');
        history = recordEdit(history, { text: '', count: 1 }, 'text');
        expect(history.past).toEqual([{ text: '', count: 0 }]);
        history = recordEdit(history, { text: '大', count: 1 }, 'text');
        history = recordEdit(history, { text: '大阪', count: 1 }, 'text');
        expect(undoEdit(history).present).toEqual({ text: '', count: 1 });
        expect(undoEdit(undoEdit(history)).present).toEqual({ text: '', count: 0 });
    });
    test('開始値に戻した後の別操作に効果のないUndoを残さない', () => {
        let history = createHistory({ text: '', count: 0 });
        history = recordEdit(history, { text: '東', count: 0 }, 'text');
        history = recordEdit(history, { text: '', count: 0 }, 'text');
        history = recordEdit(history, { text: '', count: 1 });
        history = undoEdit(history);
        expect(history.present).toEqual({ text: '', count: 0 });
        expect(history.past).toEqual([]);
        expect(redoEdit(history).present).toEqual({ text: '', count: 1 });
    });
    test('開始値に戻す編集も新しい編集として以前のRedoを破棄する', () => {
        let history = undoEdit(recordEdit(createHistory(''), '前の入力'));
        expect(recordEdit(history, '', 'text')).toBe(history);
        history = recordEdit(history, '東', 'text');
        history = recordEdit(history, '', 'text');
        expect(history.past).toEqual([]);
        expect(history.future).toEqual([]);
        expect(redoEdit(history).present).toBe('');
    });
});
