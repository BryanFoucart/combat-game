<script setup>
import { computed } from 'vue'
import { avatarUrl, fallbackAvatarUrl } from '../game/avatar.js'

const props = defineProps({
  character: { type: Object, required: true },
  side: { type: String, default: 'player' },
})

const avatar = computed(() => avatarUrl(Number(props.character.getAvatar().replace('avatar_', '')), 'fight'))
const hpPercent = computed(() => Math.max(0, (props.character.getHP() / props.character.getMaxHP()) * 100))

function useFallbackAvatar(event) {
  event.target.onerror = null
  event.target.src = fallbackAvatarUrl(Number(props.character.getAvatar().replace('avatar_', '')), 'fight')
}
</script>

<template>
  <article :class="['fighter-card', `fighter-${side}`]">
    <div class="fighter-topline"><span>{{ side === 'player' ? 'COMBATTANT' : 'ADVERSAIRE' }}</span><span>LVL {{ character.getLevel() }}</span></div>
    <div class="fighter-portrait"><img :src="avatar" :alt="`Portrait de ${character.getName()}`" @error="useFallbackAvatar" /><span class="fighter-number">{{ character.getAvatar().replace('avatar_', '#') }}</span></div>
    <h2>{{ character.getName() }}</h2>
    <div class="fighter-health"><div><span>VITALITÉ</span><strong>{{ Math.ceil(character.getHP()) }}<small> / {{ character.getMaxHP() }}</small></strong></div><div class="health-track"><span :style="{ width: `${hpPercent}%` }"></span></div></div>
    <div class="fighter-stats"><div><span>FOR</span><strong>{{ character.getStrength() }}</strong></div><div><span>END</span><strong>{{ character.getEndurance() }}</strong></div><div><span>DEX</span><strong>{{ character.getDexterity() }}</strong></div><div><span>CHA</span><strong>{{ character.getLuck() }}</strong></div></div>
  </article>
</template>