<script setup>
import { computed, onMounted, ref } from 'vue'
import CharacterCard from './components/CharacterCard.vue'
import { CharacterController } from './controllers/CharacterController.js'
import { avatarUrl, fallbackAvatarUrl } from './game/avatar.js'
import { playMatchSound, playRoundSound, setAudioEnabled } from './game/audio.js'
import { resolveCombat } from './services/combatSystem.js'
import homeBackground from './assets/background/background.webp'

const controller = new CharacterController()
const screen = ref('welcome')
const player = ref(null)
const opponent = ref(null)
const cookieChoice = ref('')
const cookieAccepted = ref(false)
const consentVisible = ref(false)
const isEditing = ref(false)
const battleRound = ref(1)
const battleLog = ref([])
const battleResult = ref('')
const selectedAction = ref('')
const battlePrompt = ref('')
const aiActsFirst = ref(false)
const soundEnabled = ref(false)
const avatarIndex = ref(1)
const form = ref(emptyForm())
const statNames = ['strength', 'dexterity', 'luck', 'endurance']
const statLabels = {
  strength: 'Force',
  dexterity: 'Dextérité',
  luck: 'Chance',
  endurance: 'Endurance',
}
const statHelp = {
  strength: 'Chaque point ajoute 2 dégâts à l’attaque. La Force est aussi multipliée par 2 dans le calcul des coups critiques.',
  dexterity: 'Chaque point donne 2 % de chance d’esquiver et augmente l’initiative. Initiative = 10 + Dextérité.',
  luck: 'Chaque point donne 2 % de chance de coup critique et augmente les gains d’XP de 10 %.',
  endurance: 'Retire sa valeur aux dégâts reçus. Augmente aussi les PV maximum de 10 par point.',
}
const actions = [
  { id: 'poing', label: 'Poing', symbol: '✊' },
  { id: 'pied', label: 'Pied', symbol: '◢' },
  { id: 'energie', label: 'Énergie', symbol: '✦' },
]

const pointBudget = computed(() => 6 + Math.max(0, (player.value?.getLevel() ?? 1) - 1) * 2)
const pointsSpent = computed(() => statNames.reduce((total, stat) => total + form.value[stat], 0))
const pointsRemaining = computed(() => pointBudget.value - pointsSpent.value)
const previewHp = computed(() => 50 + form.value.endurance * 10)
const initiativePreview = computed(() => 10 + form.value.dexterity)
const isFormValid = computed(() =>
  form.value.name.trim().length > 0 && pointsRemaining.value === 0,
)
const greeting = computed(() =>
  cookieAccepted.value && player.value ? `Bon retour, ${player.value.getName()}` : 'Bienvenue, Combattant',
)
const avatarSource = computed(() => avatarUrl(avatarIndex.value, 'profil'))

function emptyForm() {
  return { name: '', strength: 0, dexterity: 0, luck: 0, endurance: 0 }
}

function syncForm(character) {
  form.value = {
    name: character.getName(),
    strength: character.getStrength(),
    dexterity: character.getDexterity(),
    luck: character.getLuck(),
    endurance: character.getEndurance(),
  }
  avatarIndex.value = Number(character.getAvatar().replace('avatar_', '')) || 1
}

function loadSavedPlayer() {
  try {
    const stored = localStorage.getItem('fight-club-character')
    player.value = stored ? controller.restoreCharacter(JSON.parse(stored)) : null
  } catch {
    player.value = null
  }
}

function acceptCookies() {
  cookieAccepted.value = cookieChoice.value === 'yes'
  try {
    localStorage.setItem('CookieAllows', cookieAccepted.value ? 'yes' : 'no')
    if (cookieAccepted.value) loadSavedPlayer()
    else {
      player.value = null
      localStorage.removeItem('fight-club-character')
    }
  } catch {
    if (!cookieAccepted.value) player.value = null
  }
  consentVisible.value = false
}

function savePlayer() {
  if (!player.value || !cookieAccepted.value) return
  try {
    localStorage.setItem('fight-club-character', JSON.stringify(controller.serializeCharacter(player.value)))
  } catch {
    cookieAccepted.value = false
  }
}

function enterGame() {
  if (player.value) {
    syncForm(player.value)
    isEditing.value = true
    screen.value = 'profile'
  } else {
    form.value = emptyForm()
    avatarIndex.value = 1
    isEditing.value = false
    screen.value = 'setup'
  }
}

function changeAvatar(amount) {
  avatarIndex.value = ((avatarIndex.value - 1 + amount + 30) % 30) + 1
}

async function toggleAudio() {
  soundEnabled.value = await setAudioEnabled(!soundEnabled.value)
}

function changeStat(stat, amount) {
  const nextValue = form.value[stat] + amount
  if (nextValue < 0 || nextValue > 10 || (amount > 0 && pointsRemaining.value <= 0)) return
  form.value[stat] = nextValue
}

function resetStats() {
  for (const stat of statNames) form.value[stat] = 0
}

function submitCharacter() {
  if (!isFormValid.value) return
  const characterData = { ...form.value, avatar: `avatar_${avatarIndex.value}` }
  player.value = isEditing.value
    ? controller.editCharacter(player.value, characterData)
    : controller.createCharacter(characterData)
  savePlayer()
  screen.value = 'profile'
  isEditing.value = true
}

function beginBattle() {
  player.value.setHP(player.value.getMaxHP())
  opponent.value = controller.createAI(player.value)
  battleRound.value = 1
  battleLog.value = []
  battleResult.value = ''
  selectedAction.value = ''
  prepareRound()
  screen.value = 'battle'
}

function randomAction() {
  return actions[Math.floor(Math.random() * actions.length)]
}

function prepareRound() {
  aiActsFirst.value = opponent.value.getInitiative() > player.value.getInitiative()
  if (aiActsFirst.value) {
    const announcement = randomAction()
    opponent.value.setAction('')
    battlePrompt.value = `L’adversaire prend l’initiative (${opponent.value.getInitiative()}) et annonce ${announcement.label}. À toi de répondre.`
  } else {
    opponent.value.setAction('')
    battlePrompt.value = player.value.getInitiative() === opponent.value.getInitiative()
      ? `Initiative égale (${player.value.getInitiative()}) : tu choisis en premier.`
      : `Tu prends l’initiative (${player.value.getInitiative()}). Choisis ton attaque.`
  }
}

function chooseAction(action) {
  if (battleResult.value || selectedAction.value) return
  selectedAction.value = action
  player.value.setAction(action)
  opponent.value.setAction(randomAction().id)
  const outcome = resolveCombat(player.value, opponent.value)
  const aiAction = actions.find(({ id }) => id === opponent.value.getAction())
  playRoundSound(outcome.winner)
  if (outcome.damageToPlayer > 0) player.value.setHP(player.value.getHP() - outcome.damageToPlayer)
  if (outcome.damageToOpponent > 0) opponent.value.setHP(opponent.value.getHP() - outcome.damageToOpponent)

  const detail = outcome.damageDetails
  let damageBreakdown = ''
  if (detail?.dodged) {
    damageBreakdown = ` Esquive grâce à la Dextérité (${detail.dexterity * 2} %).`
  } else if (detail) {
    damageBreakdown = detail.critical
      ? ` (${detail.base} + Force ${detail.strength} × 2) × 1,5 - Endurance ${detail.endurance}.`
      : ` (${detail.base} + Force ${detail.strength} × 2 - Endurance ${detail.endurance}).`
  }
  battleLog.value.unshift(`L’IA choisit ${aiAction.label}. ${outcome.message}${damageBreakdown}`)
  if (player.value.getHP() <= 0 || opponent.value.getHP() <= 0) {
    const won = opponent.value.getHP() <= 0
    battleResult.value = won ? 'Victoire !' : 'Défaite…'
    const baseXp = won ? 25 : 10
    const earnedXp = Math.floor(baseXp * (1 + player.value.getLuck() * 0.1))
    player.value.setXP(player.value.getXP() + earnedXp)
    battleLog.value.unshift(`${won ? 'Victoire' : 'Défaite'} : +${earnedXp} XP`)
    playMatchSound(won)
    savePlayer()
    return
  }

  battleRound.value += 1
  selectedAction.value = ''
  prepareRound()
}

onMounted(() => {
  try {
    if (localStorage.getItem('CookieAllows') === 'yes') {
      cookieAccepted.value = true
      loadSavedPlayer()
      return
    }
  } catch {
    cookieAccepted.value = false
  }

  cookieChoice.value = ''
  consentVisible.value = true
})
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="brand" href="#accueil" @click.prevent="screen = 'welcome'">
        <span class="brand-mark">FC</span>
        <span>FIGHT CLUB <small>ARÈNE WEB</small></span>
      </a>
      <div class="topbar-meta"><span class="status-dot"></span> SAISON 01 <span class="topbar-divider">/</span> COMBAT EN LIGNE</div>
      <button class="sound-toggle" :aria-pressed="soundEnabled" :aria-label="soundEnabled ? 'Désactiver la musique et les sons' : 'Activer la musique et les sons'" @click="toggleAudio">
        <span aria-hidden="true">{{ soundEnabled ? '♫' : '♪' }}</span><span>{{ soundEnabled ? 'SON ON' : 'SON OFF' }}</span>
      </button>
      <div v-if="player" class="level-chip">NIV. {{ player.getLevel() }}</div>
    </header>

    <section v-if="screen === 'welcome'" class="welcome-view">
      <div class="welcome-art">
        <img class="welcome-background" :src="homeBackground" alt="Deux combattants dans une arène médiévale" />
        <div class="welcome-shade"></div>
        <div class="welcome-copy">
          <p class="eyebrow"><span>01</span> / LE DOJO VOUS ATTEND</p>
          <h1>{{ greeting }}<span class="period">.</span></h1>
          <p class="welcome-subtitle">Entre dans l’arène. Forge ton combattant. Fais parler tes poings.</p>
          <div v-if="consentVisible" class="consent-panel">
            <div>
              <p class="consent-title">Mémoire du combattant</p>
              <p class="consent-description">Autoriser le stockage local pour retrouver ton personnage à ta prochaine visite.</p>
            </div>
            <div class="consent-options" role="radiogroup" aria-label="Autorisation de stockage local">
              <button :class="['consent-option', { chosen: cookieChoice === 'yes' }]" @click="cookieChoice = 'yes'">Oui</button>
              <button :class="['consent-option', { chosen: cookieChoice === 'no' }]" @click="cookieChoice = 'no'">Non</button>
            </div>
            <p class="privacy-note">En cas de refus, ton personnage restera disponible jusqu’à la fermeture de cette page.</p>
          </div>
          <button class="button button-primary enter-button" :disabled="consentVisible && !cookieChoice" @click="consentVisible ? (acceptCookies(), enterGame()) : enterGame()">
            Entrer <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>

    <section v-else-if="screen === 'setup' || screen === 'profile'" class="builder-view">
      <div class="section-heading">
        <div><p class="eyebrow"><span>{{ screen === 'setup' ? '02' : '03' }}</span> / {{ screen === 'setup' ? 'NOUVEAU COMBATTANT' : 'TON DOSSIER' }}</p>
          <h1>{{ screen === 'setup' ? 'Crée ta légende' : 'Profil combattant' }}<span class="period">.</span></h1>
        </div>
        <div v-if="player" class="xp-display"><span>EXPÉRIENCE</span><strong>{{ player.getXP() }} <small>XP</small></strong></div>
      </div>

      <div class="builder-grid">
        <div class="portrait-panel">
          <div class="portrait-frame"><img :src="avatarSource" alt="Portrait du combattant" @error="$event.target.src = fallbackAvatarUrl(avatarIndex, 'profil')" /><span class="portrait-corner">{{ String(avatarIndex).padStart(2, '0') }} / 30</span></div>
          <div class="portrait-controls">
            <button class="icon-button" aria-label="Avatar précédent" @click="changeAvatar(-1)">←</button>
            <span>CHOISIR UN AVATAR</span>
            <button class="icon-button" aria-label="Avatar suivant" @click="changeAvatar(1)">→</button>
          </div>
          <div class="hp-preview"><div class="hp-label"><span>VITALITÉ</span><strong>{{ previewHp }} <small>PV</small></strong></div><div class="hp-track"><span :style="{ width: '100%' }"></span></div></div>
        </div>

        <div class="form-panel">
          <label class="field-label" for="fighter-name">NOM DE COMBATTANT</label>
          <input id="fighter-name" v-model="form.name" class="name-input" maxlength="22" placeholder="Ex. Kaito" autocomplete="off" />
          <div class="stats-heading"><div><p class="field-label">ATTRIBUTS</p><p class="stats-hint">Répartis tes points entre les disciplines.</p></div><div class="stat-summary"><div class="points-counter"><strong>{{ pointsRemaining }}</strong><span> / {{ pointBudget }} PTS</span></div><div class="initiative-readout"><span>INIT.</span><strong>{{ initiativePreview }}</strong></div></div></div>
          <div class="stat-list">
            <div v-for="stat in statNames" :key="stat" class="stat-row">
              <div class="stat-name"><span>{{ statLabels[stat] }}</span><span class="info-tip" tabindex="0" :aria-label="statHelp[stat]" :data-tip="statHelp[stat]">i</span></div>
              <div class="stat-control"><button class="step-button" :aria-label="`Retirer un point de ${statLabels[stat]}`" :disabled="form[stat] <= 0" @click="changeStat(stat, -1)">−</button><output>{{ form[stat] }}</output><button class="step-button" :aria-label="`Ajouter un point à ${statLabels[stat]}`" :disabled="form[stat] >= 10 || pointsRemaining <= 0" @click="changeStat(stat, 1)">+</button></div>
            </div>
          </div>
          <div class="builder-actions">
            <button v-if="screen === 'profile'" class="button button-quiet" @click="resetStats">↺ Réinitialiser</button>
            <button class="button button-primary" :disabled="!isFormValid" @click="submitCharacter">{{ screen === 'setup' ? 'Créer le combattant' : 'Enregistrer' }} <span aria-hidden="true">→</span></button>
          </div>
          <p v-if="pointsRemaining !== 0" class="validation-note">{{ pointsRemaining > 0 ? `Il reste ${pointsRemaining} point${pointsRemaining > 1 ? 's' : ''} à attribuer.` : 'Tu as dépassé le nombre de points autorisé.' }}</p>
        </div>
      </div>

      <div v-if="screen === 'profile' && player" class="profile-footer">
        <div><span class="footer-label">NIVEAU</span><strong>{{ player.getLevel() }}</strong><span class="footer-separator"></span><span class="footer-label">XP TOTAL</span><strong>{{ player.getXP() }}</strong></div>
        <button class="button button-primary" :disabled="!isFormValid" @click="submitCharacter(); beginBattle()">Combattre <span aria-hidden="true">→</span></button>
      </div>
    </section>

    <section v-else class="battle-view">
      <div class="battle-heading"><div><p class="eyebrow"><span>04</span> / COMBAT EN COURS</p><h1>{{ battleResult || 'À toi de jouer' }}<span class="period">.</span></h1></div>
        <div class="round-counter"><span>ROUND</span><strong>{{ String(battleRound).padStart(2, '0') }}</strong></div>
      </div>
      <div class="arena">
        <CharacterCard v-if="player" :character="player" side="player" />
        <div class="arena-center"><div class="versus-mark">VS</div><div class="arena-line"></div><p>CHOISIS TON ATTAQUE</p><div class="arena-line"></div></div>
        <CharacterCard v-if="opponent" :character="opponent" side="opponent" />
      </div>
      <div class="action-area">
        <div class="turn-guidance">
          <p class="turn-prompt" role="status">{{ battlePrompt }}</p>
          <span class="info-tip turn-info" tabindex="0" aria-label="À propos de l’annonce de l’IA" data-tip="L’action annoncée est tirée séparément de son vrai choix : elle peut être vraie ou être un bluff.">i</span>
        </div>
        <div class="action-cards">
          <button v-for="action in actions" :key="action.id" :class="['action-card', { selected: selectedAction === action.id }]" :disabled="!!battleResult || !!selectedAction" @click="chooseAction(action.id)">
            <span class="action-symbol">{{ action.symbol }}</span><span class="action-label">{{ action.label }}</span><span class="action-index">0{{ actions.indexOf(action) + 1 }}</span>
          </button>
        </div>
        <div v-if="battleLog.length" class="battle-feed" aria-live="polite"><p v-for="(entry, index) in battleLog.slice(0, 3)" :key="`${entry}-${index}`">{{ entry }}</p></div>
        <div v-if="battleResult" class="battle-end"><p>{{ player.getXP() }} XP AU TOTAL <span>·</span> NIVEAU {{ player.getLevel() }}</p><button class="button button-primary" @click="screen = 'profile'; syncForm(player)">Retour au profil <span aria-hidden="true">→</span></button></div>
        <p v-else class="combat-hint">Poing bat Énergie <span>·</span> Pied bat Poing <span>·</span> Énergie bat Pied</p>
      </div>
    </section>

    <footer class="page-footer"><span>FIGHT CLUB © 2026</span><span>COMBATTRE AVEC HONNEUR</span><span>V. 1.0.0</span></footer>
  </main>
</template>