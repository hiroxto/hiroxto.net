# hiroxto.net

Code of hiroxto.net

## ローカルでの確認

開発中は `npm run dev` を実行し、`http://localhost:3000` にアクセスする。
Cloudflare Workers 向けのビルドとキャッシュを確認する場合は、次の順に実行する。

```sh
npm run build:cf
npm run preview
```

プレビューの接続先は起動時に表示される URL を使用する。
これらのコマンドは本番環境へのデプロイを行わない。

OG URL とサイトマップの URL は、ローカル・プレビュー環境でも `https://hiroxto.net` を使用する。
画面の表示・操作と内部リンクの遷移は、アクセスしたローカル・プレビュー環境で確認できる。

## 静的生成とキャッシュ

ページはビルド時に静的生成し、OpenNext の Workers Static Assets キャッシュから配信する。
メタ情報の生成でリクエストヘッダーを参照すると動的描画になるため、URL の基準には
`lib/metadata/site-origin.ts` の固定値を使用する。

このキャッシュは読み取り専用であり、コンテンツの更新には再ビルドとデプロイが必要。
ISR による再検証は使用しない。
