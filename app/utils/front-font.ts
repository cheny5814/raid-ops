// Canvas 单独选择字体；英文保留小写字形，中文沿用本地艺术字。
export function frontFont(size: number, language: 'en' | 'zh' = 'en') {
  const family = language === 'zh' ? '"Front Play", "Front Arcade", sans-serif' : '"Front Tactical", Arial, sans-serif'
  return `${size}px ${family}`
}
