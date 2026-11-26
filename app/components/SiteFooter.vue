<script setup lang="ts">
import { PUBLIC_PAGES } from '~~/shared/site'
</script>
<template><footer class="site-footer"><NuxtLink to="/" class="footer-brand">RAID OPS</NuxtLink><p>A single-player run and gun game. Built for a keyboard and a desktop browser.</p><nav aria-label="Footer"><NuxtLink v-for="page in PUBLIC_PAGES.filter(page => page.path !== '/')" :key="page.path" :to="page.path">{{ page.label }}</NuxtLink><NuxtLink to="/">Play RAID OPS</NuxtLink></nav></footer></template>
