<script setup lang="ts">
import { gameSiteSchema } from '~/content/site-schema'
const engaged = ref(false)
function gameActivity(active: boolean) {
  engaged.value = active
  if (active) window.scrollTo({ top: 0, behavior: 'instant' })
}

useSiteSeo('/')
useHead({ script: [{ key: 'game-site-schema', type: 'application/ld+json', innerHTML: JSON.stringify(gameSiteSchema()) }] })
</script>
<template>
  <div class="game-home" :class="{ 'game-engaged': engaged }">
    <main>
      <section id="game-top" class="play-page" aria-label="RAID OPS game">
        <div class="play-stage"><ClientOnly><GameHost @active="gameActivity"/><template #fallback><GameLoading /></template></ClientOnly></div>
        <p class="mobile-note">RAID OPS requires a keyboard. To play, open this page on a computer.</p>
      </section>
    </main>
  </div>
</template>
