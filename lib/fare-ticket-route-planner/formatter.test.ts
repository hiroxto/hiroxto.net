import { describe, expect, test } from 'vitest';
import { format } from './formatter';

describe('format', () => {
    test('経路が空の場合は空文字を返す', () => {
        expect(format([])).toBe('');
    });

    test('最後の路線名の後ろに接続駅を付けずに整形する', () => {
        expect(
            format([
                { id: '1', line: '東海道線', station: '東京' },
                { id: '2', line: '山手線', station: '新宿' },
                { id: '3', line: '中央線', station: '' },
            ]),
        ).toBe('東海道線\n     東京\n山手線\n     新宿\n中央線');
    });
});
