let audioContext;
let musicGain;
let effectsGain;
let musicInterval;
let duckTimeout;
let musicIndex = 0;
let enabled = true;
let musicMode = "menu";
let musicDucked = false;
let unlockRegistered = false;

const calmMelody = [
  392, 493.88, 587.33, 493.88, 440, 523.25, 659.25, 523.25, 349.23, 440, 523.25,
  440,
];
const calmBass = [130.81, 98, 110, 146.83];
const battleMelody = [220, 261.63, 293.66, 220, 329.63, 293.66, 261.63, 196];
const battleBass = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49];

function getAudioContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;

  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();
  musicGain = audioContext.createGain();
  effectsGain = audioContext.createGain();
  musicGain.gain.value = 0;
  effectsGain.gain.value = 0;
  musicGain.connect(audioContext.destination);
  effectsGain.connect(audioContext.destination);
  return audioContext;
}

function getMusicVolume() {
  if (musicDucked) return 0.035;
  return musicMode === "battle" ? 0.3 : 0.22;
}

function updateMusicGain() {
  if (!audioContext || !musicGain) return;
  musicGain.gain.setTargetAtTime(
    getMusicVolume(),
    audioContext.currentTime,
    0.08,
  );
}

function playTone(
  frequency,
  delay = 0,
  duration = 0.18,
  waveform = "triangle",
  volume = 0.16,
  destination = effectsGain,
) {
  if (
    !enabled ||
    !audioContext ||
    !destination ||
    audioContext.state !== "running"
  )
    return;

  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playMusicStep() {
  if (!enabled || audioContext?.state !== "running") return;

  if (musicMode === "battle") {
    const melodyNote = battleMelody[musicIndex % battleMelody.length];
    const bassNote = battleBass[musicIndex % battleBass.length];
    playTone(bassNote, 0, 0.17, "sawtooth", 0.14, musicGain);
    playTone(
      melodyNote,
      0.025,
      0.14,
      musicIndex % 2 ? "square" : "sawtooth",
      0.055,
      musicGain,
    );
    if (musicIndex % 4 === 0)
      playTone(melodyNote * 2, 0.04, 0.09, "triangle", 0.025, musicGain);
  } else {
    const melodyNote = calmMelody[musicIndex % calmMelody.length];
    const bassNote = calmBass[Math.floor(musicIndex / 3) % calmBass.length];
    const waveform = musicIndex % 3 === 0 ? "sine" : "triangle";
    playTone(melodyNote, 0, 0.44, waveform, 0.1, musicGain);
    if (musicIndex % 3 === 0)
      playTone(bassNote, 0, 0.58, "sine", 0.055, musicGain);
    if (musicIndex % 4 === 2)
      playTone(melodyNote * 1.5, 0.12, 0.3, "sine", 0.025, musicGain);
  }

  musicIndex += 1;
}

function startMusicLoop() {
  if (
    !enabled ||
    !audioContext ||
    audioContext.state !== "running" ||
    musicInterval
  )
    return;
  updateMusicGain();
  playMusicStep();
  musicInterval = window.setInterval(
    playMusicStep,
    musicMode === "battle" ? 200 : 560,
  );
}

function removeUnlockListeners() {
  if (!unlockRegistered || typeof window === "undefined") return;
  window.removeEventListener("pointerdown", resumeAfterGesture);
  window.removeEventListener("keydown", resumeAfterGesture);
  unlockRegistered = false;
}

function resumeAfterGesture() {
  if (!enabled || !audioContext) return;
  audioContext
    .resume()
    .then(() => {
      removeUnlockListeners();
      startMusicLoop();
    })
    .catch(() => registerUnlockListeners());
}

function registerUnlockListeners() {
  if (unlockRegistered || typeof window === "undefined") return;
  window.addEventListener("pointerdown", resumeAfterGesture);
  window.addEventListener("keydown", resumeAfterGesture);
  unlockRegistered = true;
}

export function setMusicMode(mode) {
  const nextMode = mode === "battle" ? "battle" : "menu";
  if (musicMode === nextMode) return;

  musicMode = nextMode;
  musicIndex = 0;
  if (musicInterval) {
    window.clearInterval(musicInterval);
    musicInterval = null;
  }
  startMusicLoop();
}

export function setAudioEnabled(value) {
  const context = getAudioContext();
  if (!context) return false;

  enabled = Boolean(value);
  if (enabled) {
    effectsGain.gain.setTargetAtTime(0.65, context.currentTime, 0.08);
    updateMusicGain();
    if (context.state === "running") startMusicLoop();
    else {
      registerUnlockListeners();
      context
        .resume()
        .then(() => {
          removeUnlockListeners();
          startMusicLoop();
        })
        .catch(() => registerUnlockListeners());
    }
  } else {
    removeUnlockListeners();
    window.clearInterval(musicInterval);
    window.clearTimeout(duckTimeout);
    musicInterval = null;
    musicDucked = false;
    musicGain.gain.setTargetAtTime(0, context.currentTime, 0.08);
    effectsGain.gain.setTargetAtTime(0, context.currentTime, 0.08);
  }

  return enabled;
}

function duckMusic(duration) {
  if (!enabled || !audioContext || !musicGain) return;
  musicDucked = true;
  updateMusicGain();
  window.clearTimeout(duckTimeout);
  duckTimeout = window.setTimeout(() => {
    musicDucked = false;
    updateMusicGain();
  }, duration);
}

export function playRoundSound(winner) {
  duckMusic(650);
  if (winner === "player") {
    playTone(660, 0, 0.12);
    playTone(880, 0.1, 0.16);
  } else if (winner === "opponent") {
    playTone(330, 0, 0.14, "sawtooth", 0.1);
    playTone(247, 0.12, 0.2, "sawtooth", 0.1);
  } else {
    playTone(440, 0, 0.16, "sine", 0.1);
  }
}

export function playMatchSound(playerWon) {
  duckMusic(1700);
  const notes = playerWon
    ? [523.25, 659.25, 783.99, 1046.5]
    : [392, 329.63, 261.63, 196];
  notes.forEach((note, index) => {
    playTone(
      note,
      0.38 + index * 0.16,
      0.24,
      playerWon ? "triangle" : "sawtooth",
      0.13,
    );
  });
}
