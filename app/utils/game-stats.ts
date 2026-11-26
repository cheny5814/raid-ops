// Event names contain only fixed campaign/mission identifiers, never saved game data.
export function createGameStats(send: (name: string) => void) {
  let mission = '', active = false, played = 0
  const milestones = new Set<number>()
  const emit = (name: string) => { try { send(name) } catch { /* Gameplay must survive analytics failures. */ } }
  return {
    begin(campaign: 'grayhaven' | 'sandstorm', level: number, kind: 'start' | 'continue' | 'retry') {
      mission = `${campaign}_${String(level + 1).padStart(2, '0')}`
      active = true
      emit(`game_${kind}_${mission}`)
    },
    tick(seconds: number) {
      if (!active || !Number.isFinite(seconds) || seconds <= 0 || seconds > 1) return
      played += seconds
      for (const threshold of [60, 300]) if (played + 1e-6 >= threshold && !milestones.has(threshold)) {
        milestones.add(threshold); emit(`play_${threshold}s`)
      }
    },
    finish(kind: 'game_fail' | 'mission_complete' | 'game_exit') {
      if (!active) return
      active = false
      emit(`${kind}_${mission}`)
    },
  }
}
