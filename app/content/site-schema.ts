import { SITE, canonicalUrl, pageSeo } from '#shared/site'
import { GAME_FACTS } from './game-facts.ts'
export function gameSiteSchema() {
  const home = canonicalUrl('/')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${home}#website`, name: SITE.name, url: home, inLanguage: GAME_FACTS.siteLanguage, about: { '@id': `${home}#game` } },
      { '@type': 'VideoGame', '@id': `${home}#game`, name: SITE.name, url: home,
        description: pageSeo('/').description,
        genre: ['Action', 'Run and gun', 'Side-scrolling shooter'], gamePlatform: GAME_FACTS.platform,
        playMode: 'https://schema.org/SinglePlayer', isAccessibleForFree: GAME_FACTS.isFree,
        softwareVersion: GAME_FACTS.version, inLanguage: GAME_FACTS.gameLanguages,
        image: canonicalUrl(SITE.shareImage), screenshot: GAME_FACTS.screenshots.map(canonicalUrl),
        mainEntityOfPage: home,
      },
    ],
  }
}
