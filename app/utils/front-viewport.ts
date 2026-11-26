// 世界坐标与视野保持不变；仅限制绘制像素，避免 Retina / 4K 全屏重绘数千万像素。
// 导航、HUD 和菜单使用独立 DOM，仍按屏幕原生分辨率显示。
export const FRONT_PIXEL_BUDGET = 1920 * 1080
export function frontViewport(cssWidth: number, cssHeight: number, deviceRatio = 1) {
  const logicalHeight = 480, logicalWidth = Math.max(460, cssWidth / cssHeight * logicalHeight)
  const ratio = Math.min(Math.max(1, Number.isFinite(deviceRatio) ? deviceRatio : 1), 2, 8192 / Math.max(cssWidth, cssHeight), Math.sqrt(FRONT_PIXEL_BUDGET / (cssWidth * cssHeight)))
  const pixelWidth = Math.max(1, Math.floor(cssWidth * ratio)), pixelHeight = Math.max(1, Math.floor(cssHeight * ratio))
  return { logicalWidth, pixelWidth, pixelHeight, scaleX: pixelWidth / logicalWidth, scaleY: pixelHeight / logicalHeight }
}
