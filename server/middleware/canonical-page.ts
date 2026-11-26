import { canonicalPagePath } from '../../shared/site'
export default defineEventHandler(event => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const url = getRequestURL(event)
  const path = canonicalPagePath(url.pathname)
  if (path) return sendRedirect(event, path + url.search, 301)
})
