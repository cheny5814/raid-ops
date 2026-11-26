<script setup lang="ts">
import { GAME_FACTS } from '~/content/game-facts'
</script>
<template>
<div id="field-guide" class="home-content" tabindex="-1" data-home-content>

  <section class="section content-width home-intro" aria-labelledby="about-heading">
    <div class="section-heading"><p class="eyebrow">Inside the battlefield</p><h2 id="about-heading">A run and gun game with a tactical edge.</h2>
    <p>RAID OPS is a free, single-player side-scrolling shooter for desktop browsers. Move through military dockyards, industrial districts and desert outposts as Falcon or Silver Fox. Two campaigns take you from a harbor under occupation to a stronghold beyond the dunes.</p>
    <p>Play straight from the menu above, with no account or separate installation. Your unlocked arsenal and mission records stay in this browser for your next visit.</p></div>
    <div class="facts" aria-label="Current game content"><p><strong>{{ GAME_FACTS.missions }}</strong> Missions</p><p><strong>{{ GAME_FACTS.weapons }}</strong> Weapons</p><p><strong>{{ GAME_FACTS.operatives }}</strong> Operatives</p><p><strong>{{ GAME_FACTS.arsenalLevels }}</strong> Arsenal levels</p></div>
  </section>
  <section class="section content-width home-gallery" aria-labelledby="screenshots-heading"><div class="section-heading"><p class="eyebrow">Choose your battlefield</p><h2 id="screenshots-heading">Two fronts to fight through.</h2><p>A missing squad in an occupied harbor. An armored stronghold beyond the dunes. Pick a campaign and fight your way in.</p></div>
    <div class="campaign-grid">
      <figure class="campaign-card"><img src="/iron-front/scenery/harbor-night-v1.png" alt="Night falls over the cranes, cargo ships and industrial docks of Grayhaven" width="2172" height="724" loading="lazy" decoding="async"/><figcaption><h3>Grayhaven</h3><p>Your squad has gone silent behind the harbor blockade. Land on the night-shift docks, push through occupied factories and follow their signal across six missions. Seize the enemy’s guns and vehicles on the way to the final confrontation.</p></figcaption></figure>
      <figure class="campaign-card"><img src="/iron-front/scenery/desert-border-v1.png" alt="Desert cliffs and a fortified outpost on the Red Sand Frontier" width="2172" height="724" loading="lazy" decoding="async"/><figcaption><h3>Sandstorm</h3><p>Beyond the dunes, an enemy outpost guards the Red Sand Frontier. Cross sinking sands, strike the fuel facilities and reach the stronghold before facing the Sand Scorpion armored boss. One desert mission is available now, with a different route and hazards from Grayhaven.</p></figcaption></figure>
    </div>
  </section>
  <section class="section content-width faq-section" aria-labelledby="faq-heading"><div class="section-heading"><p class="eyebrow">Before you play</p><h2 id="faq-heading">RAID OPS FAQ</h2></div><div class="faq-list">
    <details><summary>Is RAID OPS free, and do I need an account?</summary><p>You can play the current game for free without registering. It runs in your browser and needs no separate game installation. A desktop or laptop keyboard is required for the controls described here.</p></details>
    <details><summary>Can I play with another person?</summary><p>RAID OPS is single-player. Falcon and Silver Fox are alternative operative choices, not two simultaneous players. Multiplayer and touch controls are not included in the current game.</p></details>
    <details><summary>What stays after I close the game?</summary><p>Earned weapons, shared research, mission records and preferences stay in this browser's local storage. They are not synchronized between devices, browsers or domains. Clearing this site's browser data removes the saved records. Use Start game to continue a saved battlefield or choose a new attempt. Quick start does not replace your saved game.</p></details>



  </div></section>
  <section class="closing content-width"><div><h2>Your next mission is waiting.</h2><p>Choose a campaign above, or read the controls, weapon guide and battlefield tactics before you deploy.</p><NuxtLink to="/how-to-play" class="text-link">How to play RAID OPS</NuxtLink></div><a class="button" href="#game-top">Back to game</a></section>
</div>
</template>
