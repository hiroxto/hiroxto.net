# リポジトリの作業規則

## このファイルの管理

リポジトリ固有で、今後も繰り返し使う規則だけを記載する。一般的な開発論、単発の作業メモ、その場限りの判断は追加しない。依頼者からの指摘も、この基準で反映する。

## 作業に応じて読むスキル

| 作業 | 参照先 |
| --- | --- |
| テストの設計・修正、変更後の検証 | [verify-repository-changes](.agents/skills/verify-repository-changes/SKILL.md) |
| Playwright による確認の要否・範囲の判断、計画・実行 | [plan-playwright-verification](.agents/skills/plan-playwright-verification/SKILL.md) |
| コミットや PR 作成を伴う作業への着手、PR 本文の作成・更新 | [prepare-repository-pull-request](.agents/skills/prepare-repository-pull-request/SKILL.md) |

## 技術構成と開発コマンド

- Next.js App Router / TypeScript
- UI は Mantine を優先し、Tailwind CSS v4 は補助用途に使う。
- 状態管理は Zustand、テストは Vitest + Testing Library + jsdom、整形・Lint は Biome を使う。
- Cloudflare Workers へ OpenNext でデプロイする。ローカルの Node.js は mise で管理する。

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバーを `http://localhost:3000/` で起動 |
| `npm run build` | Next.js の本番ビルド |
| `npm run build:cf` | Cloudflare Workers 向けのビルド |
| `npm run check` | TypeScript の型検査 |

## 配置と責務

実装前に依頼内容と既存コードの責務を確認する。ファイルを追加する際や配置に迷う場合は、同種の機能と近接テストを読み、命名・分割の粒度を合わせる。対象機能、入出力、期待する表示・挙動が不明な場合は、推測で実装せず依頼者へ確認する。

| ディレクトリ | 配置するもの |
| --- | --- |
| `app/` | ルーティングとレイアウト。トップページは `app/page.tsx`、ツールは `app/tools/*/page.tsx` |
| `components/` | 再利用する UI と画面単位の表示ロジック。共通部品は `components/common/` |
| `lib/` | ドメインロジック、データ変換、純粋関数、ページ設定 |
| `hooks/` | 複数箇所で再利用する React Hooks |
| `types/` | グローバル型定義、補助的な型宣言 |
| `public/` | 静的ファイル |
| `scripts/` | 生成・保守用スクリプト |
| `test/` | Vitest の共通セットアップ、テストユーティリティ |

- UI に密接な state / store は `components/<feature>/stores/` に置いてよい。再利用する純粋ロジックは `lib/` に置く。
- 一つのコンポーネントで完結する一時的な状態はローカル state を優先する。共有・永続化する状態には、その機能の store を検討する。
- 単純な props の組み立てや単発の Web API 呼び出しだけを理由に `lib/` へ切り出さない。再利用性や独立した仕様がなければ、コンポーネント内で責務を整理する。

## コードの書き方

- named export を優先する。Next.js のページやレイアウトなど、フレームワークが求める箇所では default export を使う。
- 関数は TSX では `function` による宣言、`lib/` ではアロー関数を優先する。
- ファイル名は `site-page-frame.tsx` のような kebab-case、コンポーネント名は PascalCase、変数・関数名は camelCase とする。
- import にはルートを指すエイリアス `@/` を使う。

## 仕様コメントと実装を一致させる

一部の機能では、ソースコード内のコメントを仕様書としている。例は `lib/tokyometro-transfer-search/search.ts` の冒頭を参照する。

- 機能を変更する前に、関係する仕様コメントを読む。
- 条件、入出力、制約、処理手順が変わる場合は、実装と併せて仕様コメントも更新する。
- 仕様が不明な場合は依頼者へ確認する。実装から推測して仕様コメントを書き換えない。
- 完了前に仕様コメント・実装・関連テストの整合を確認する。完了報告には、更新箇所または更新不要と判断した理由を書く。

## 生成ファイルは生成元から更新する

- `lib/train-number/gen/*.ts` は直接編集しない。
- `lib/train-number/content/*.md` を更新したら、`npm run generate:train-number-content` で再生成する。
- 生成結果の差分は `npm run check:train-number-content` で確認する。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
