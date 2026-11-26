// Verified standalone product facts. This is a local version, not a publication date.
export const GAME_FACTS = {
  version: '0.1.0', releaseStatus: 'local-preview',
  missions: 7, campaigns: 2, weapons: 6, operatives: 2, arsenalLevels: 8,
  campaignContent: [{ id: 'grayhaven', name: 'Grayhaven', missions: 6 }, { id: 'sandstorm', name: 'Sandstorm', missions: 1 }],
  platform: 'Desktop web browser', input: 'Keyboard', playMode: 'SinglePlayer',
  isFree: true, accountRequired: false, separateInstallation: false,
  gameLanguages: ['en'], siteLanguage: 'en',
  storage: { scope: 'This browser on this device', cloudSync: false, liveSessionResume: true, progressKey: 'raid-ops-progress-v1', preferencesKey: 'raid-ops-preferences-v1', sessionKey: 'raid-ops-progress-v1:session-v1' },
  limitations: ['No touch controls', 'No multiplayer', 'No cross-device save synchronization'],
  screenshots: ['/iron-front/screenshots/grayhaven.png', '/iron-front/screenshots/sandstorm.png'],
} as const
