// Count a page view on load and on every in-site navigation
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  let last = ''
  const pv = (path: string) => { if (path !== last) { last = path; trackPage(path) } }
  nuxtApp.hook('app:mounted', () => pv(router.currentRoute.value.path))
  router.afterEach((to) => { if (nuxtApp.isHydrating) return; pv(to.path) })
})
