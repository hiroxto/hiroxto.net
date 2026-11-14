import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    // Cloudflare が直接配信する静的ファイルには public/_headers で同じヘッダーを設定する。
    headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
                ],
            },
        ];
    },
};

export default nextConfig;
