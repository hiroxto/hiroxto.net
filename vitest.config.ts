import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname),
        },
    },
    test: {
        environment: 'jsdom',
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
        setupFiles: ['./test/setup.tsx'],
        hookTimeout: 30000,
        testTimeout: 30000,
    },
});
