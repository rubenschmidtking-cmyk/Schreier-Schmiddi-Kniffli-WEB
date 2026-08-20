import type { Settings } from './types'

const KEY = 'ssk-settings-v1'
export const defaultSettings: Settings = { sound: true, shakeToRoll: false, playerName: 'Spieler 1', cpuDifficulty: 'normal' }

export function loadSettings(): Settings {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return defaultSettings }
}
export function saveSettings(settings: Settings) { try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch {} }
