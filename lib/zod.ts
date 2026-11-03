import { z } from 'zod';

// CSP で禁止する動的コード生成を、スキーマの定義前から無効にする。
z.config({ jitless: true });

export { z };
