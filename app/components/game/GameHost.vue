<script setup lang="ts">
import { shallowRef, ref, nextTick, onErrorCaptured, onMounted, onBeforeUnmount, type Component } from 'vue'
const emit = defineEmits<{ active: [value: boolean] }>()
const game = shallowRef<Component | null>(null)
const failed = ref(false)
const errorPanel = ref<HTMLElement | null>(null)
let generation = 0
let timer: ReturnType<typeof setTimeout> | undefined
async function loadGame() {
  const current = ++generation
  clearTimeout(timer)
  failed.value = false
  game.value = null
  emit('active', false)
  try {
    const module = await Promise.race([
      import('./RaidOpsGame.vue'),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Game loading timed out')), 20000) }),
    ])
    if (current === generation) game.value = module.default
  } catch {
    if (current === generation) showError()
  } finally {
    if (current === generation) clearTimeout(timer)
  }
}
function showError() {
  failed.value = true
  game.value = null
  emit('active', false)
  nextTick(() => errorPanel.value?.focus({ preventScroll: true }))
}
function reloadPage() { window.location.reload() }
onErrorCaptured(() => { showError(); return false })
onMounted(loadGame)
onBeforeUnmount(() => { generation++; clearTimeout(timer) })
</script>
<template>
  <section v-if="failed" ref="errorPanel" class="game-launch game-load-error" tabindex="-1" aria-labelledby="game-error-heading">
    <div><p class="eyebrow">Battlefield unavailable</p><h1 id="game-error-heading">RAID OPS could not load</h1>
    <p>Check your connection and try again. If the problem continues, refresh the page to load the latest game files.</p>
    <p class="support-note">Your saved weapons, research and mission records will stay in this browser.</p>
    <div class="actions loading-links"><button class="button" @click="loadGame">Try again</button><button class="retry-secondary" @click="reloadPage">Refresh page</button></div>
    <div class="actions loading-links"><NuxtLink to="/how-to-play">Read the controls</NuxtLink><NuxtLink to="/about">About the game</NuxtLink></div></div>
  </section>
  <component :is="game" v-else-if="game" @active="emit('active', $event)" />
  <GameLoading v-else />
</template>
