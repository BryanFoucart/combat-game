let audioContext;
let masterGain;
let musicInterval;
let musicIndex = 0;
let enabled = false;

const melody = [392, 523.25, 659.25, 523.25, 440, 587.33, 698.46, 587.33];

function getAudioContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;

  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);
  return audioContext;
}

function playTone(
  frequency,
  delay = 0,
  duration = 0.18,
  waveform = "triangle",
  volume = 0.16,
) {
  if (!enabled || !audioContext || !masterGain) return;

  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playMusicStep() {
  const frequency = melody[musicIndex % melody.length];
  playTone(frequency, 0, 0.28, "triangle", 0.12);
  if (musicIndex % 4 === 0) playTone(frequency / 2, 0, 0.42, "sine", 0.08);
  musicIndex += 1;
}

export async function setAudioEnabled(value) {
  const context = getAudioContext();
  if (!context) return false;

  enabled = Boolean(value);
  if (enabled) {
    await context.resume();
    masterGain.gain.setTargetAtTime(0.55, context.currentTime, 0.08);
    if (!musicInterval) {
      playMusicStep();
      musicInterval = window.setInterval(playMusicStep, 340);
    }
  } else {
    window.clearInterval(musicInterval);
    musicInterval = null;
    masterGain.gain.setTargetAtTime(0, context.currentTime, 0.08);
  }

  return enabled;
}

export function playRoundSound(winner) {
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
