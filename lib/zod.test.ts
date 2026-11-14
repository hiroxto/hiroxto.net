import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from '@/lib/zod';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CSP 下での入力検証', () => {
    it('動的コード生成を試みずに有効な入力を受理し、無効な入力を拒否する', () => {
        const dynamicFunction = vi.spyOn(globalThis, 'Function').mockImplementation(() => {
            throw new EvalError('CSP blocks dynamic code generation');
        });
        const schema = z.object({ count: z.number().int().positive() });

        expect(schema.safeParse({ count: 1 })).toMatchObject({ success: true, data: { count: 1 } });
        expect(schema.safeParse({ count: 0 }).success).toBe(false);
        expect(dynamicFunction).not.toHaveBeenCalled();
    });
});
