import { Configuration } from '@nuxt/types';

const config: Configuration = {
  mode: 'universal',

  /*
  ** Headers of the page
  */
  head: {
    titleTemplate: '%s - hiroto-k.net',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Generic description.' },
      { hid: 'robots', name: 'robots', content: 'index,follow' },
      { hid: 'format-detection', name: 'format-detection', content: 'telephone=no' },
      { hid: 'google-site-verification', name: 'google-site-verification', content: 'JtZLyisjURDKETCGeivTJKTDCg5kKbe1tipLhHn_fq8' }
    ],
    link: [
      { rel: 'apple-touch-icon', sizes: '192x192', href: '/apple-touch-icon.png' },
      { rel: 'author', type: 'text/plain', href: '/humans.txt' },
    ],
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: [
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],

  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',

    '@nuxt/typescript-build',

    '@nuxtjs/sitemap',
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
  ],

  /*
  ** Build configuration
  */
  build: {
    extractCSS: true,
  },

  sitemap: {
    hostname: 'https://hiroto-k.net',
    exclude: [
      '/404',
    ],
    routes: [
      {
        url: '/',
        changefreq: 'yearly',
        priority: 1,
        lastmod: '2019-12-10',
      },
    ],
  },
};

export default config;
