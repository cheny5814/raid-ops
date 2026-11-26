import { canonicalPagePath } from '../../shared/site.ts'
export default defineNuxtRouteMiddleware(to => {
  const path = canonicalPagePath(to.path)
  if (path) return navigateTo({ path, query: to.query, hash: to.hash }, { redirectCode: 301, replace: true })
})
