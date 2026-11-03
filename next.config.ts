import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

// 静的生成の Next.js スクリプトと Mantine のスタイルにはインライン実行が必要。
// Cloudflare が直接配信する静的ファイルには public/_headers で同じ本番ポリシーを適用する。
const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' https://api.foursquare.com${isDevelopment ? ' ws: wss:' : ''}`,
    "worker-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ');

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

export default nextConfig;
