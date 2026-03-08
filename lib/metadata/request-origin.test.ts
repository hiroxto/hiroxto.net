import { describe, expect, it } from 'vitest';
import { resolveRequestOriginFromHeaders } from './request-origin';

describe('resolveRequestOriginFromHeaders', () => {
    it('x-forwarded-host が優先して使用されること', () => {
        const requestHeaders = new Headers({
            'x-forwarded-host': 'forwarded.example.com',
            host: 'host.example.com',
            'x-forwarded-proto': 'https',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://forwarded.example.com/');
    });

    it('x-forwarded-host がない場合は host が使用されること', () => {
        const requestHeaders = new Headers({
            host: 'host.example.com',
            'x-forwarded-proto': 'https',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://host.example.com/');
    });

    it('ホストがない場合はフォールバックが使用されること', () => {
        const requestHeaders = new Headers({
            'x-forwarded-proto': 'https',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://www.hiroxto.net/');
    });

    it('x-forwarded-proto が優先して使用されること', () => {
        const withProtoHeaders = new Headers({
            host: 'host.example.com',
            'x-forwarded-proto': 'http',
        });

        expect(resolveRequestOriginFromHeaders(withProtoHeaders).toString()).toBe('http://host.example.com/');
    });

    it('x-forwarded-proto がない場合は https が使用されること', () => {
        const withoutProtoHeaders = new Headers({
            host: 'host.example.com',
        });

        expect(resolveRequestOriginFromHeaders(withoutProtoHeaders).toString()).toBe('https://host.example.com/');
    });

    it('x-forwarded-host の先頭値が使用されること', () => {
        const requestHeaders = new Headers({
            'x-forwarded-host': 'first.example.com, second.example.com',
            host: 'host.example.com',
            'x-forwarded-proto': 'https, http',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://first.example.com/');
    });
});
