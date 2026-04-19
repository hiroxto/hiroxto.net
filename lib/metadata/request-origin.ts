import { headers } from 'next/headers';

const FALLBACK_HOST = 'hiroxto.net';
const FALLBACK_PROTOCOL = 'https';

const getFirstHeaderValue = (value: string | null): string | null => {
    if (value == null) {
        return null;
    }

    const firstValue = value.split(',')[0]?.trim();

    if (firstValue == null || firstValue.length === 0) {
        return null;
    }

    return firstValue;
};

const resolveProtocol = (rawProtocol: string | null): string => {
    const protocol = getFirstHeaderValue(rawProtocol)?.toLowerCase();

    if (protocol === 'http' || protocol === 'https') {
        return protocol;
    }

    return FALLBACK_PROTOCOL;
};

const resolveHost = (rawForwardedHost: string | null, rawHost: string | null): string => {
    const forwardedHost = getFirstHeaderValue(rawForwardedHost);
    if (forwardedHost != null) {
        return forwardedHost;
    }

    const host = getFirstHeaderValue(rawHost);
    if (host != null) {
        return host;
    }

    return FALLBACK_HOST;
};

export const resolveRequestOriginFromHeaders = (requestHeaders: Headers): URL => {
    const protocol = resolveProtocol(requestHeaders.get('x-forwarded-proto'));
    const host = resolveHost(requestHeaders.get('x-forwarded-host'), requestHeaders.get('host'));

    return new URL(`${protocol}://${host}`);
};

export const getRequestOrigin = async (): Promise<URL> => {
    const requestHeaders = await headers();
    return resolveRequestOriginFromHeaders(requestHeaders);
};
