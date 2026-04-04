# Repository Guidelines

## 運用ルール

- 各セッションで今後に活かせる学びや依頼者からのフィードバックがあった場合は、次回以降にも活かせるよう @AGENTS.md に反映する

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
  - 関数定義はTSXではfunctionでの関数宣言，lib/配下ではアロー関数を使用する。
- ファイル名は `site-page-frame.tsx` のような kebab-case、React コンポーネント名は PascalCase、変数名・関数名は camelCase を使用する。
- ページ固有でない表示ロジックは `components/`、純粋なロジックは `lib/` に配置する。
- 別ファイルを import する際はプロジェクトルートのエイリアス `@/` を使用する。
- コード整形にはBiomeを使用する。コード変更後は`npm run lint:fix`と`npm run format:fix`を実行する。

## テスト方針

- テストには Vitest を使用する。
- テストファイル名は `*.test.ts` または `*.test.tsx` とし、対象実装の近くに配置する。
    - たとえば `lib/foo/bar.ts` に対するテストは `lib/foo/bar.test.ts` に配置する。
- ページのテストは画面表示が正しいことの確認に寄せ、入力値の組み立てや状態遷移のような純粋ロジックは可能な限り関数単位のテストへ寄せる。
- コンポーネントのテストは props の細かな変換結果よりも、ユーザー操作に対する振る舞いの確認を優先する。
- `title` や `description` のようなページメタ情報・説明文そのものの自動テストは原則不要。
- 単純な props 組み立てや Web API 呼び出しのためだけに `lib/` へロジックを切り出さない。再利用性や独立した仕様が薄い場合は、コンポーネント内に寄せたままテスト責務だけを整理する。
- テストケース名は「それ以外」のような曖昧な表現を避け、前提条件と期待結果が分かる具体的な文言にする。

ロジック変更時は関連テストの追加または更新を行い、PR 作成前に `npm run test` を実行すること。

## コミットとプルリクエスト

- タスクを進めながら適度な粒度でコミットする
- `git add`, `git commit`, `git restore`, `git rebase` など `.git/index.lock` を使う操作は並列実行しない
- `git status`, `git diff`, `git log` などの参照系コマンドは並列でもよいが、index を更新する操作は必ず直列で行う
- 履歴では `feat:`, `fix:`, `delete:`, `style:`, `docs:`, `chore:` のような短い Conventional Commits 形式を使用する。コミットメッセージは簡潔な日本語で記述する。
    - スコープやBREAKING CHANGEは不要
    - 削除が主目的の変更では `delete:` を優先して使用する。
    - 例: `feat: 録画ファイル名生成を追加`, `fix: パンくずの表示崩れを修正`, `delete: 未使用パラメータを削除`, `style: lint:fix`。
- プルリクエストには概要、確認内容、関連 Issue があればそのリンクを含める。UI 変更時はスクリーンショットを添付する。

## 修正後の確認内容

コードの修正を行った際は以下のコマンドを実行してlint，test，buildを実行します。

1. `npm run lint:fix`: コード整形
2. `npm run test`: テスト実行
3. `npm run build`: ビルド実行

## 動作確認

機能追加や修正を行った後は必ず playwright skill を使ってブラウザで動作確認を実施すること。
確認時は CLI ラッパーを使い、必要に応じて `--headed` で表示を確認します。
起動したローカルサーバーのプロセスや Playwright のセッションは使い回さず必要になった際に都度起動すること。

動作確認手順
1. 事前準備: `npm run dev`でローカルサーバーを起動する。通常 `http://localhost:3000/` でサーバーが起動します。
2. 追加・修正した機能の動作確認
    1. レイアウト崩れがないか: PC サイズとスマートフォンサイズの両方で表示してレイアウト崩れが発生していないことを確認する。スクリーンショットを出力する際は`.playwright-cli/`ディレクトリ配下に出力する。
    2. 動作が仕様通りか: 追加または修正した機能が仕様通りに動作することを確認する
3. 既存機能の動作確認。追加または修正した範囲外で影響が予想される場合は影響範囲も動作確認します。
