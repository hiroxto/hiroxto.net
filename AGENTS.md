# Repository Guidelines

## 基本方針

- このファイルには、このリポジトリで作業する際の repo 固有ルールだけを書く。
- 各セッションで得た学びや依頼者からのフィードバックのうち、このリポジトリで今後も繰り返し有効なリポジトリ固有ルールに限り `AGENTS.md` に反映する。一般的な開発論、単発の作業メモ、その場限りの判断は追記しない。
- 実装前に、依頼内容と既存コードの責務分担を確認してから変更する。

## 技術スタック

- フレームワーク: Next.js App Router
- 言語: TypeScript
- UI: Mantine
- スタイリング: Tailwind CSS v4
  - UI は Mantine を優先し、Tailwind は補助用途に留める。
- 状態管理: Zustand
- テスト: Vitest + Testing Library + jsdom
- 整形 / Lint: Biome
- デプロイ: Cloudflare Workers
  - OpenNext を使用する。
- ローカルの Node.js バージョン管理: mise

## ディレクトリ構成

- `app/`: ルーティングとレイアウト。トップページは `app/page.tsx`、各ツールページは `app/tools/*/page.tsx` に配置する。
- `components/`: 再利用可能な UI と画面単位の表示ロジック。共通部品は `components/common/` に配置する。
- `lib/`: ドメインロジック、データ変換、純粋関数、ページ設定などを配置する。
- `hooks/`: 複数箇所で再利用する React Hooks を配置する。
- `types/`: グローバル型定義や補助的な型宣言を配置する。
- `public/`: 静的ファイルを配置する。
- `scripts/`: 生成スクリプトや保守用スクリプトを配置する。
- `test/`: Vitest の共通セットアップやテストユーティリティを配置する。

## 主要コマンド

- `npm run dev`: ローカル開発サーバーを `http://localhost:3000/` で起動する。
- `npm run build`: Next.js の本番ビルドを作成する。
- `npm run build:cf`: OpenNext / Cloudflare Workers 向けのビルドを実行する。
- `npm run test`: Vitest を実行する。
- `npm run check`: TypeScript の型検査を行う。
- `npm run lint:fix`: Biome のチェックと自動修正を実行する。
- `npm run format:fix`: Biome で整形を適用する。

## 実装ルール

- プロジェクト全体で TypeScript を使用する。
- export は named export を優先し、Next.js のページやレイアウトなどフレームワーク都合の箇所のみ default export を使用する。
- 関数定義は、TSX では `function` による関数宣言、`lib/` 配下ではアロー関数を優先する。
- ファイル名は `site-page-frame.tsx` のような kebab-case、React コンポーネント名は PascalCase、変数名・関数名は camelCase を使用する。
- ページ固有でない表示ロジックは `components/`、純粋なロジックは `lib/` に配置する。
- UI に密接な state / store は feature 配下の `components/<feature>/stores/` に置いてよい。再利用前提の純粋ロジックまで `components/` に混ぜない。
- import にはプロジェクトルートのエイリアス `@/` を使用する。
- 単純な props 組み立てや単発の Web API 呼び出しのためだけに `lib/` へ切り出さない。再利用性や独立した仕様が薄い場合は、コンポーネント内に寄せたまま責務だけ整理する。

## 生成物の扱い

- `lib/train-number/gen/*.ts` は生成ファイルのため、直接編集しない。
- `lib/train-number/content/*.md` を更新した場合は `npm run generate:train-number-content` で再生成する。
- 生成物の差分確認には `npm run check:train-number-content` を使用する。

## テスト方針

- テストには Vitest を使用する。
- テストファイル名は `*.test.ts` または `*.test.tsx` とし、対象実装の近くに配置する。
  - 例: `lib/foo/bar.ts` に対するテストは `lib/foo/bar.test.ts`
- ページのテストは画面表示の確認を優先し、入力値の組み立てや状態遷移のような純粋ロジックは可能な限り関数単位のテストへ寄せる。
- コンポーネントのテストは props の細かな変換結果よりも、ユーザー操作に対する振る舞いの確認を優先する。
- `title` や `description` のようなページメタ情報や説明文そのものの自動テストは原則不要。
- テストケース名は「それ以外」のような曖昧な表現を避け、前提条件と期待結果が分かる具体的な文言にする。
- ロジック変更時は、関連テストの追加または更新を行う。

## 修正後の確認内容

1. Biome のチェックと自動修正を行う。実行コマンド: `npm run lint:fix`
2. Biome で整形を適用する。実行コマンド: `npm run format:fix`
3. テストを実行する。実行コマンド: `npm run test`

## 動作確認

機能追加や修正を行った後、UI に変更がある場合は Playwright を使ってブラウザで動作確認を実施すること。
UI 非依存の変更や、単体テストで仕様を十分に担保できる変更では、Playwright による動作確認は不要とする。
UI への影響が少しでも想定される変更では、Playwright による確認を優先する。

Playwright で動作確認する際、起動したローカルサーバーのプロセスや Playwright のセッションは使い回さず必要になった際に都度起動すること。
スクリーンショットや操作に関連するファイルを保存する場合は `.playwright-cli/` 配下に出力する。

動作確認手順
1. 事前準備としてローカルサーバーを起動する。実行コマンド: `npm run dev`
2. 追加・修正した機能の動作確認。Playwright を使用する
    1. 追加・修正した機能が仕様通りに動作することを確認する。
    2. UI 変更を行った場合、PC サイズとスマートフォンサイズの両方で表示確認を行い、文字切れ、要素の重なり、意図しない横スクロールのようなレイアウト崩れや操作不能がないかを確認する。
3. 変更箇所と同じ共通部品を使う既存機能があって変更による影響が予想される場合は対象の既存機能の動作確認を行う。

## コミットとプルリクエスト

- コミットやプルリクエスト作成を伴う作業では、変更内容を意図単位で分離する。
- コミットが必要な場合は、タスク完了時に一括でコミットせず、作業の区切りごとに適切な粒度でコミットする。
- `git add`、`git commit`、`git restore`、`git rebase` など `.git/index.lock` を使う操作は並列実行しない。
- `git status`、`git diff`、`git log` などの参照系コマンドは並列でもよいが、index を更新する操作は必ず直列で行う。
- コミットメッセージは短い Conventional Commits 形式を使用し、簡潔な日本語で記述する。
  - 使用する接頭辞: `feat:`, `fix:`, `delete:`, `style:`, `docs:`, `chore:`, `test:`, `ci:`
  - スコープや `BREAKING CHANGE` は不要
  - 削除が主目的の変更では `delete:` を優先する
- プルリクエストには概要、確認内容、関連 Issue があればそのリンクを含める。UI 変更時はスクリーンショットを添付する。
