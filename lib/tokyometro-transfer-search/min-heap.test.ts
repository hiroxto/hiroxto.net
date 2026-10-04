import { describe, expect, it } from 'vitest';
import { createMinHeap } from '@/lib/tokyometro-transfer-search/min-heap';

describe('createMinHeap', () => {
    it('空の状態と最後の要素を取り出した後はundefinedを返す', () => {
        const heap = createMinHeap<number>((a, b) => a - b);
        expect(heap.pop()).toBeUndefined();
        heap.push(5);
        expect(heap.pop()).toBe(5);
        expect(heap.pop()).toBeUndefined();
        heap.push(2);
        expect(heap.pop()).toBe(2);
    });

    it('追加と取り出しを混在させても最小値から取り出せる', () => {
        const heap = createMinHeap<number>((a, b) => a - b);
        for (const value of [9, 4, 7, 1, 3, 8, 2, 6, 5]) heap.push(value);
        expect(heap.pop()).toBe(1);
        expect(heap.pop()).toBe(2);
        heap.push(0);
        heap.push(4);
        expect(Array.from({ length: 9 }, () => heap.pop())).toEqual([0, 3, 4, 4, 5, 6, 7, 8, 9]);
        expect(heap.pop()).toBeUndefined();
    });

    it('比較関数で同順位となる要素も欠落させずに返す', () => {
        const heap = createMinHeap<{ id: string; distance: number }>((a, b) => a.distance - b.distance);
        heap.push({ id: 'a', distance: 2 });
        heap.push({ id: 'b', distance: 0 });
        heap.push({ id: 'c', distance: 2 });
        expect(heap.pop()).toEqual({ id: 'b', distance: 0 });
        expect([heap.pop(), heap.pop()]).toEqual(
            expect.arrayContaining([
                { id: 'a', distance: 2 },
                { id: 'c', distance: 2 },
            ]),
        );
        expect(heap.pop()).toBeUndefined();
    });
});
