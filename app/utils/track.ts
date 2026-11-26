// First-party usage stats: page views and named game events, without cookies or persistent visitor IDs.
// Every visit is sent; the stats service labels likely automated browsers instead of dropping them.
// Sent to /e on our own domain; nginx forwards it to the stats service. Only counted on the live domain, never on localhost.
const SITE_HOST = 'runandgun.games'
let first = true

// Page-view id: a random string kept only in memory for the current page view, so clicks and the
// "engaged" signal can be tied to the view they belong to. Never written to cookies or storage.
let pvid = ''
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6)

const live = () => !import.meta.dev && typeof window !== 'undefined' && location.hostname === SITE_HOST

function send(body: Record<string, any>) {
  if (!live()) return
  // Hints that help the stats service tell people from automated browsers (only used to label visits, never stored as-is)
  let tz = ''
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch {}
  const hints = { wd: navigator.webdriver ? 1 : 0, v: document.visibilityState, sw: screen.width, sh: screen.height, tz }
  const s = JSON.stringify({ s: SITE_HOST, l: navigator.language, i: pvid, ...hints, ...body })
  try {
    if (navigator.sendBeacon?.('/e', s)) return
  } catch {}
  try { void fetch('/e', { method: 'POST', body: s, keepalive: true }).catch(() => {}) } catch { /* Stats never interrupt the game. */ }
}

// "Engaged": the page has been visible for 5 seconds in total (time in a background tab doesn't count). Sent once per page view.
const ENGAGED_MS = 5000
let visibleMs = 0, visibleSince = 0, engagedTimer: ReturnType<typeof setTimeout> | null = null, engagedSent = false, listening = false
function armEngaged() {
  if (engagedTimer) clearTimeout(engagedTimer)
  engagedTimer = null
  if (engagedSent || document.visibilityState !== 'visible') return
  visibleSince = Date.now()
  engagedTimer = setTimeout(() => { engagedSent = true; send({ k: 'eg', p: location.pathname }) }, Math.max(0, ENGAGED_MS - visibleMs))
}
function onVisibility() {
  if (document.visibilityState === 'visible') armEngaged()
  else {
    if (visibleSince) visibleMs += Date.now() - visibleSince
    visibleSince = 0
    if (engagedTimer) clearTimeout(engagedTimer)
    engagedTimer = null
  }
}

// "Interacted": the first real input in this page view (mouse wheel or move, pointer press, touch, key). Only whether it
// happened is sent, never where. Scroll events aren't used: in-site navigation scrolls the page by itself.
let actedSent = false
const INPUTS = ['wheel', 'pointermove', 'pointerdown', 'touchstart', 'keydown'] as const
function onInput() {
  if (actedSent || !pvid) return
  actedSent = true
  send({ k: 'ia', p: location.pathname })
}

// Page view. The first one of a page load is an "entry" unless we came from another page on this site.
export function trackPage(path: string) {
  if (!live()) return
  pvid = newId()
  visibleMs = 0; visibleSince = 0; engagedSent = false; actedSent = false
  if (!listening && typeof document !== 'undefined') {
    listening = true
    document.addEventListener('visibilitychange', onVisibility)
    for (const t of INPUTS) window.addEventListener(t, onInput, { passive: true, capture: true })
  }
  // ix: this script reports interactions, so a view without one really had none
  const body: Record<string, any> = { k: 'pv', p: path, ix: 1 }
  if (first) {
    first = false
    let internal = false
    try { internal = !!document.referrer && new URL(document.referrer).hostname.replace(/^www\./, '') === SITE_HOST } catch {}
    // A reload keeps the original referrer (e.g. Google); don't count it as a new visit from there
    const reload = (performance.getEntriesByType?.('navigation')[0] as any)?.type === 'reload'
    if (!internal && !reload) {
      body.e = 1
      try { body.r = document.referrer ? new URL(document.referrer).origin : '' } catch { body.r = '' }
      body.u = new URLSearchParams(location.search).get('utm_source') || ''
    }
  }
  send(body)
  armEngaged()
}

// Button click, e.g. track('start_camera')
export function track(name: string) {
  if (!live() || !pvid) return
  send({ k: 'ev', n: name, p: location.pathname })
}
