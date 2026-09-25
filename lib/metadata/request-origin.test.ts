import { describe, expect, it } from 'vitest';
import { resolveRequestOriginFromHeaders } from './request-origin';

describe('resolveRequestOriginFromHeaders', () => {
    it('x-forwarded-host と host がある場合は x-forwarded-host を使う', () => {
        const requestHeaders = new Headers({
            'x-forwarded-host': 'forwarded.example.com',
            host: 'host.example.com',
            'x-forwarded-proto': 'https',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://forwarded.example.com/');
    });

    it('x-forwarded-host がない場合は host を使う', () => {
        const requestHeaders = new Headers({
            host: 'host.example.com',
            'x-forwarded-proto': 'https',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://host.example.com/');
    });

    it('ホストがない場合は既定のドメインを使う', () => {
        const requestHeaders = new Headers({
            'x-forwarded-proto': 'https',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://hiroxto.net/');
    });

    it('x-forwarded-proto がある場合はその通信方式を使う', () => {
        const withProtoHeaders = new Headers({
            host: 'host.example.com',
            'x-forwarded-proto': 'http',
        });

        expect(resolveRequestOriginFromHeaders(withProtoHeaders).toString()).toBe('http://host.example.com/');
    });

    it('x-forwarded-proto がない場合は https を使う', () => {
        const withoutProtoHeaders = new Headers({
            host: 'host.example.com',
        });

        expect(resolveRequestOriginFromHeaders(withoutProtoHeaders).toString()).toBe('https://host.example.com/');
    });

    it('ヘッダー値が空白だけの場合は既定の URL を使う', () => {
        const requestHeaders = new Headers({
            'x-forwarded-host': '   ',
            host: '   ',
            'x-forwarded-proto': '   ',
        });

        expect(resolveRequestOriginFromHeaders(requestHeaders).toString()).toBe('https://hiroxto.net/');
    });

    it('x-forwarded-proto は大文字でも解釈する', () => {
        const requestHeaders = new Headers({
            host: 'host.example.com',
            'x-forwarded-proto': 'HTTP',
        });

        expect(resolveRequestOriginFromHeaders(requestHeaders).toString()).toBe('http://host.example.com/');
    });

    it('x-forwarded-proto が http・https 以外の場合は https を使う', () => {
        const requestHeaders = new Headers({
            host: 'host.example.com',
            'x-forwarded-proto': 'ftp',
        });

        expect(resolveRequestOriginFromHeaders(requestHeaders).toString()).toBe('https://host.example.com/');
    });

    it('x-forwarded-host に複数の値がある場合は先頭を使う', () => {
        const requestHeaders = new Headers({
            'x-forwarded-host': 'first.example.com, second.example.com',
            host: 'host.example.com',
            'x-forwarded-proto': 'https, http',
        });

        const origin = resolveRequestOriginFromHeaders(requestHeaders);

        expect(origin.toString()).toBe('https://first.example.com/');
    });

    it('x-forwarded-host の先頭値が空の場合は host を使う', () => {
        const requestHeaders = new Headers({
            'x-forwarded-host': ' , second.example.com',
            host: 'host.example.com',
        });

        expect(resolveRequestOriginFromHeaders(requestHeaders).toString()).toBe('https://host.example.com/');
    });
});
