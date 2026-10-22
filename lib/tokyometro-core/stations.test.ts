import { describe, expect, it } from 'vitest';
import { stationIdSchema } from '@/lib/tokyometro-core/stations';

describe('駅IDの検証', () => {
    it.each(['constructor', '__proto__', 'unknown'])('存在しない駅ID %s は拒否する', (value) => {
        expect(stationIdSchema.safeParse(value).success).toBe(false);
    });
});
