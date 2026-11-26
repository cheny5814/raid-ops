import { SITE, indexedPaths } from './shared/site'
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/site.css'],
  app: { head: { htmlAttrs: { lang: 'en' }, meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }, { name: 'theme-color', content: '#091a25' }], link: [{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-v2-32.png' }, { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-v2-64.png' }, { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-v2.png' }] } },
  runtimeConfig: { public: { siteUrl: SITE.origin, indexable: process.env.SITE_INDEXABLE === 'true' } },
  routeRules: { '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }, '/iron-front/**': { headers: { 'cache-control': 'public, max-age=86400' } } },
  nitro: { prerender: { crawlLinks: true, routes: [...indexedPaths(), '/robots.txt', '/sitemap.xml'], ignore: indexedPaths().includes('/contact') ? [] : ['/contact'] } },
})
