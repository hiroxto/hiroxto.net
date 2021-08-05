import { NuxtConfig } from '@nuxt/types';

const config: NuxtConfig = {
  mode: 'universal',

  /*
  ** Headers of the page
  */
  head: {
    titleTemplate: '%s - hiroxto.net',
    htmlAttrs: {
      lang: 'ja',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Generic description.' },
      { hid: 'robots', name: 'robots', content: 'index,follow' },
      { hid: 'format-detection', name: 'format-detection', content: 'telephone=no' },
      // { hid: 'google-site-verification', name: 'google-site-verification', content: 'JtZLyisjURDKETCGeivTJKTDCg5kKbe1tipLhHn_fq8' },
      { hid: 'theme-color', name: 'theme-color', content: '#1B64DF' },
    ],
    link: [
      { rel: 'apple-touch-icon', sizes: '192x192', href: '/apple-touch-icon.png' },
      { rel: 'author', type: 'text/plain', href: '/humans.txt' },
    ],
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#1B64DF' },

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

    '@nuxtjs/composition-api/module',

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
    hostname: 'https://www.hiroxto.net',
    exclude: [
      '/404',
    ],
    routes: [
      {
        url: '/',
        changefreq: 'yearly',
        priority: 1,
        lastmod: '2020-03-10',
      },
    ],
  },
};

export default config;
