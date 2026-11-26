import { SITE, canonicalUrl, pageSeo, type SitePath } from '~~/shared/site'
export function useSiteSeo(path: SitePath) {
  const page = pageSeo(path)
  const canonical = canonicalUrl(path)
  const indexable = !import.meta.dev && useRuntimeConfig().public.indexable && page.index
  const image = canonicalUrl(SITE.shareImage)
  useSeoMeta({
    title: page.title, description: page.description, robots: indexable ? 'index,follow' : 'noindex,nofollow',
    ogTitle: page.title, ogDescription: page.description, ogUrl: canonical, ogType: 'website', ogSiteName: SITE.name,
    ogImage: image, ogImageType: 'image/png', ogImageWidth: SITE.shareImageWidth, ogImageHeight: SITE.shareImageHeight, ogImageAlt: SITE.shareImageAlt,
    twitterCard: 'summary_large_image', twitterTitle: page.title, twitterDescription: page.description, twitterImage: image, twitterImageAlt: SITE.shareImageAlt,
  })
  useHead({ link: [{ rel: 'canonical', href: canonical }] })
}
