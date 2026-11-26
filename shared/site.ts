import { ownerInfoReady, contactInfoReady } from './site-owner.ts'
export const SITE = {
  name: 'RAID OPS', origin: 'https://runandgun.games',
  shareImage: '/images/raid-ops-share.png', shareImageAlt: 'RAID OPS — a run and gun game for desktop browsers, against the Grayhaven harbor at night',
  shareImageWidth: 1200, shareImageHeight: 630,
} as const
const CORE_PAGES = [
  { path: '/', title: 'RAID OPS: Free Online Run and Gun Game', description: 'Play RAID OPS, an original 2D run and gun shooter for desktop browsers. Fight through 7 missions, unlock 6 weapons and defeat powerful bosses. No download required.', label: 'Play RAID OPS', index: true },
  { path: '/how-to-play', title: 'How to Play RAID OPS — Controls, Weapons and Campaign Guide', description: 'Learn RAID OPS keyboard controls, operative skills, weapon switching, checkpoints, battlefield equipment and boss tactics before your next run and gun mission.', label: 'How to play', index: true },
  { path: '/about', title: 'About RAID OPS — The Game, Campaigns and Current Version', description: 'Meet RAID OPS, a single-player military browser game. Learn about its campaigns, operative choices, shared arsenal progression, local saves and current scope.', label: 'About', index: true },
  { path: '/privacy', title: 'Privacy and Local Saves — RAID OPS', description: 'How RAID OPS uses browser storage for game progress and preferences, and what happens when you clear this site’s data.', label: 'Privacy', index: true },
] as const
const OWNER_PAGES = [
  { path: '/contact', title: 'Contact RAID OPS — Feedback and Bug Reports', description: 'Contact the RAID OPS operator with gameplay feedback, bug reports and questions about the browser game.', label: 'Contact', index: true },
  { path: '/terms', title: 'Terms of Use — RAID OPS', description: 'Read the terms for using the RAID OPS website and playing the browser game, including local saves and permitted use.', label: 'Terms', index: true },
] as const
// Terms require the confirmed public identity; contact also needs a real email.
export const PUBLIC_PAGES = [...CORE_PAGES, ...OWNER_PAGES.filter(page => page.path === '/contact' ? contactInfoReady() : ownerInfoReady())]
export type SitePath = typeof CORE_PAGES[number]['path'] | typeof OWNER_PAGES[number]['path']
export function canonicalUrl(path: string) { return new URL(path, SITE.origin).href }
export function pageSeo(path: SitePath) {
  const page = PUBLIC_PAGES.find(page => page.path === path)
  if (!page) throw new Error(`Unknown public page: ${path}`)
  return page
}
export function indexedPaths() { return PUBLIC_PAGES.filter(page => page.index).map(page => page.path) }

// Normalize only real public pages. Unknown or disabled routes keep their 404.
export function canonicalPagePath(path: string) {
  if (path === '/' || !path.endsWith('/')) return null
  const trimmed = path.replace(/\/+$/, '')
  return PUBLIC_PAGES.some(page => page.path === trimmed) ? trimmed : null
}
