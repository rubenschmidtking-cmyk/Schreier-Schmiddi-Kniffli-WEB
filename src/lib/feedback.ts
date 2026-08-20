let rollAudio: HTMLAudioElement | null = null
let scoreAudio: HTMLAudioElement | null = null

function play(audio: HTMLAudioElement | null, src: string, enabled: boolean, volume = 1) {
  if (!enabled) return
  try {
    const element = audio ?? new Audio(src)
    element.preload = 'auto'
    element.volume = volume
    element.currentTime = 0
    void element.play()
    return element
  } catch {
    return audio
  }
}

export function playRollSound(enabled: boolean) {
  rollAudio = play(rollAudio, '/sounds/dice-roll.mp3', enabled, 0.9) ?? rollAudio
}

export function playScoreTone(enabled: boolean, special = false) {
  scoreAudio = play(scoreAudio, '/sounds/score-lock.mp3', enabled, special ? 1 : 0.88) ?? scoreAudio
}

export function preloadGameSounds() {
  try {
    rollAudio ??= new Audio('/sounds/dice-roll.mp3')
    scoreAudio ??= new Audio('/sounds/score-lock.mp3')
    rollAudio.preload = 'auto'
    scoreAudio.preload = 'auto'
  } catch {}
}

export function softVibrate(pattern: number | number[] = 15) {
  try { navigator.vibrate?.(pattern) } catch {}
}
