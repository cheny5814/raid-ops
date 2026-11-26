import { canonicalUrl } from '../../shared/site'
export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return config.public.indexable && !import.meta.dev ? `User-agent: *\nAllow: /\nSitemap: ${canonicalUrl('/sitemap.xml')}\n` : 'User-agent: *\nDisallow: /\n'
})
