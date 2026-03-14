import { describe, expect, it } from 'vitest';
import { isTicketType } from './utils';

describe('isTicketType', () => {
    it('定義済みの乗車券種別を true と判定すること', () => {
        expect(isTicketType('片道乗車券')).toBe(true);
        expect(isTicketType('往復乗車券')).toBe(true);
        expect(isTicketType('連続乗車券')).toBe(true);
        expect(isTicketType('別線往復乗車券')).toBe(true);
    });

    it('未定義の文字列を false と判定すること', () => {
        expect(isTicketType('片道')).toBe(false);
        expect(isTicketType('片道乗車券 ')).toBe(false);
        expect(isTicketType(' 片道乗車券')).toBe(false);
        expect(isTicketType('')).toBe(false);
    });
});
