# Repository Guidelines

## 技術スタック

- フレームワーク: Next.js
- 言語: TypeScript
- 状態管理ライブラリ: Zustand
- UIライブラリ: Mantine
- CSSフレームワーク: Tailwind
    - Mantineのコンポーネントを優先して使用し，TailwindはMantineの補助として利用
- 本番デプロイ先: Cloudflare Workers
    - OpenNextを使用

## プロジェクト構成

このリポジトリは Next.js ベースのWebアプリケーションです。

ディレクトリ構造
- `app/`: ルーティング。トップページは `app/page.tsx`，各ツールページは `app/tools/*/page.tsx` に配置されています
- `components/`: 再利用可能な UI 。共通レイアウトやリンク部品は`components/common/`に配置する。
- `lib/`: ドメインロジックや汎用ユーティリティ関数。テストは実装ファイルの近くに`*.test.ts`として配置する。
- `public/`: 静的ファイル。

## 開発・ビルド・テスト用の主要コマンド

- `npm run dev`: ローカル開発サーバーを `http://localhost:3000/` で起動する。
- `npm run build`: 本番用ビルドを作成する。
- `npm run preview`: OpenNext / Cloudflare 向けビルドをローカルで確認する。
- `npm run test`: `Vitest` によるテストを実行する。
- `npm run check`: TypeScript の型検査を行う。
- `npm run lint:fix`: `biome check --write` で自動修正を適用する。
- `npm run format:fix`: `biome format --write` で整形を適用する。

## コーディング規約と命名

- プロジェクト全体で TypeScript を使用する。
- 共有しやすい処理は named export を優先し， Next.js のページなどフレームワーク都合の箇所のみ default export を使用する。
- ファイル名は `site-page-frame.tsx` のような kebab-case、React コンポーネント名は PascalCase、変数名・関数名は camelCase を使用する。
- ページ固有でない表示ロジックは `components/`、純粋なロジックは `lib/` に配置する。
- 別ファイルを import する際はプロジェクトルートのエイリアス `@/` を使用する。
- コード整形にはBiomeを使用する。コード変更後は`npm run lint:fix`と`npm run format:fix`を実行する。

## テスト方針

- テストには Vitest を使用する。
- テストファイル名は `*.test.ts` または `*.test.tsx` とし、対象実装の近くに配置する。
    - たとえば `lib/foo/bar.ts` に対するテストは `lib/foo/bar.test.ts` に配置する。

ロジック変更時は関連テストの追加または更新を行い、PR 作成前に `npm run test` を実行すること。

## コミットとプルリクエスト

- 履歴では `feat:`, `fix:`, `style:` のような短い Conventional Commits 形式を使用する。コミットメッセージは簡潔な日本語で記述する。
    - 例: `feat: 録画ファイル名生成を追加`, `fix: パンくずの表示崩れを修正`, `style: lint:fix`。
- プルリクエストには概要、確認内容、関連 Issue があればそのリンクを含める。UI 変更時はスクリーンショットを添付する。

## 動作確認

機能追加や修正を行った後は必ず playwright skill を使ってブラウザで動作確認を実施すること。
確認時は CLI ラッパーを使い、必要に応じて `--headed` で表示を確認します。

動作確認手順
1. 事前準備: `npm run dev`でローカルサーバーを起動する。通常 `http://localhost:3000/` でサーバーが起動します。
2. 追加・修正した機能の動作確認
    1. レイアウト崩れがないか: PC サイズとスマートフォンサイズの両方で表示し、レイアウト崩れが発生していないことを確認する
    2. 動作が仕様通りか: 追加または修正した機能が仕様通りに動作することを確認する
3. 既存機能の動作確認。追加または修正した範囲外で影響が予想される場合は影響範囲も動作確認します。
