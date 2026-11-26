<script setup lang="ts">
defineProps<{ error: { statusCode?: number } }>()
useHead({ title: 'Page not found — RAID OPS', meta: [{ name: 'robots', content: 'noindex,follow' }] })
</script><template><main class="game-launch error-page"><div><p class="eyebrow">RAID OPS</p><h1>{{ error.statusCode === 404 ? 'Page not found' : 'Unable to load this page' }}</h1><p>Return to the game homepage to choose your next mission.</p><a href="/" class="button">Back to home</a></div></main></template>
