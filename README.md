# hiroxto.net

Code of hiroxto.net

## ローカルでの確認

開発中は `npm run dev` を実行し、`http://localhost:3000` にアクセスする。
Cloudflare Workers 向けのビルドと配信を確認する場合は、次の順に実行する。

```sh
npm run build:cf
npm run preview
```

プレビューの接続先は起動時に表示される URL を使用する。
これらのコマンドは本番環境へのデプロイを行わない。

OG URL とサイトマップの URL は、ローカル・プレビュー環境でも `https://hiroxto.net` を使用する。
画面の表示・操作と内部リンクの遷移は、アクセスしたローカル・プレビュー環境で確認できる。

## 静的生成とキャッシュ

ページはビルド時に静的生成し、OpenNext の増分キャッシュとキャッシュ割り込みを使って、
Workers Static Assets に配置したキャッシュから返す。キャッシュにあるページは NextServer を読み込まずに返す。
`searchParams` を使う `/tools/tokyometro-transfer-search` は動的描画のため、NextServer で処理する。
静的ファイルは Workers Static Assets から配信する。
メタ情報の生成でリクエストヘッダーを参照すると動的描画になるため、URL の基準には
`lib/metadata/site-origin.ts` の固定値を使用する。

このキャッシュには次の制約がある。

- 読み取り専用で、ISR や `revalidatePath` などの再検証には対応しない。コンテンツの更新には再ビルドとデプロイが必要。
- `'use cache'` には対応しない。使うと、キャッシュの取得のたびに例外が発生し、エラーログが記録される。

キャッシュは `npm run build:cf` の中で `.open-next/assets/cdn-cgi/_next_cache` に配置する。
このため、Workers Builds のビルドコマンドは `npm run build:cf` にする必要がある。
`npx opennextjs-cloudflare build` などに変えるとキャッシュが配置されないが、`wrangler deploy` は成功する。
この場合、すべてのページが NextServer で処理され、Workers Logs には要求のたびに
`StaticAssetsIncrementalCache: Failed to set to read-only cache` のエラーが記録される。
