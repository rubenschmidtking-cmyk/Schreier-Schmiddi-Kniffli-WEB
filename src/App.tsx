import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Download, Gamepad2, Globe2, Settings2, Users2, Bot } from 'lucide-react'
import GameScreen from './components/GameScreen'
import LocalGameScreen from './components/LocalGameScreen'
import OnlineMatch from './components/OnlineMatch'
import RulesModal from './components/RulesModal'
import SettingsModal from './components/SettingsModal'
import InstallGuide from './components/InstallGuide'
import { loadSettings, saveSettings } from './lib/settings'
import { preloadGameSounds } from './lib/feedback'
import type { Settings } from './lib/types'

type Screen =
  | { kind: 'home' }
  | { kind: 'cpu' }
  | { kind: 'local' }
  | { kind: 'online'; code: string; role: 'host' | 'guest' }

function randomRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(5)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else for (let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*0xffffffff)
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join('')
}

function cleanRoom(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

function roleStorageKey(code: string) { return `kniffli:room-role:${code}` }

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [screen, setScreen] = useState<Screen>({ kind: 'home' })
  const [joinCode, setJoinCode] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => preloadGameSounds(), [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const room = cleanRoom(params.get('room') ?? '')
    if (room.length === 5) {
      setJoinCode(room)
      const savedRole = localStorage.getItem(roleStorageKey(room))
      setScreen({ kind: 'online', code: room, role: savedRole === 'host' ? 'host' : 'guest' })
    }
  }, [])

  useEffect(() => {
    if (screen.kind === 'online') {
      try { localStorage.setItem(roleStorageKey(screen.code), screen.role) } catch {}
      const url = new URL(location.href)
      url.searchParams.set('room', screen.code)
      history.replaceState({}, '', url)
    } else {
      const url = new URL(location.href)
      url.searchParams.delete('room')
      history.replaceState({}, '', url)
    }
  }, [screen])

  const home = () => setScreen({ kind: 'home' })
  const openOnline = (code: string, role: 'host'|'guest') => {
    const clean = cleanRoom(code)
    if (clean.length !== 5) return
    try { localStorage.setItem(roleStorageKey(clean), role) } catch {}
    setScreen({ kind: 'online', code: clean, role })
  }

  const canJoin = joinCode.length === 5
  const greeting = useMemo(() => settings.playerName.trim() || 'Spieler 1', [settings.playerName])

  if (screen.kind === 'cpu') return <GameScreen settings={settings} onExit={home} />
  if (screen.kind === 'local') return <LocalGameScreen settings={settings} onExit={home} />
  if (screen.kind === 'online') return <OnlineMatch code={screen.code} role={screen.role} settings={settings} onExit={home} />

  return (
    <main className="home-screen screen-shell dash-home">
      <div className="dash-bg-glow" aria-hidden="true" />
      <header className="dash-home-header">
        <button className="round-action neon" onClick={() => setShowRules(true)} aria-label="Anleitung"><BookOpen /></button>
        <span className="dash-header-pill">SCHMIDDI &amp; SCHREIER</span>
        <button className="round-action neon" onClick={() => setShowInstall(true)} aria-label="Installieren"><Download /></button>
      </header>

      <section className="dash-hero">
        <img className="dash-float-die dash-float-die-a" src="/brand/dice-dash-die.png" alt="" aria-hidden="true" />
        <img className="dash-float-die dash-float-die-b" src="/brand/dice-dash-die.png" alt="" aria-hidden="true" />
        <img className="dash-float-die dash-float-die-c" src="/brand/dice-dash-die.png" alt="" aria-hidden="true" />
        <img className="dash-logo" src="/brand/dice-dash-logo.png" alt="Schmiddi & Schreier Dice Dash" />
        <p className="dash-subline">Dice Dash als iPhone Web App – solo, lokal oder online mit bis zu 4 Spielern.</p>
      </section>

      <section className="dash-mode-stack" aria-label="Spielmodus wählen">
        <button className="dash-mode-button dash-mode-primary" onClick={() => setScreen({ kind: 'cpu' })}>
          <span className="dash-button-icon"><Bot /></span>
          <span>SOLO SPIELEN</span>
        </button>

        <button className="dash-mode-button" onClick={() => setScreen({ kind: 'local' })}>
          <span className="dash-button-icon"><Users2 /></span>
          <span>LOKAL SPIELEN</span>
        </button>

        <div className="dash-online-panel">
          <div className="dash-online-head">
            <span className="dash-button-icon globe"><Globe2 /></span>
            <div>
              <strong>ONLINE SPIELEN</strong>
              <small>Live auf 2–4 iPhones · nacheinander wie am echten Tisch</small>
            </div>
          </div>

          <label className="dash-inline-field">
            <span>DEIN NAME</span>
            <input
              value={settings.playerName}
              maxLength={16}
              autoComplete="nickname"
              placeholder="z. B. Ruben"
              onChange={e => setSettings({ ...settings, playerName: e.target.value })}
            />
          </label>

          <div className="dash-online-actions">
            <button className="dash-small-action red" disabled={!settings.playerName.trim()} onClick={() => openOnline(randomRoomCode(), 'host')}>
              RAUM ERSTELLEN
            </button>
            <div className="dash-join-row">
              <input
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                maxLength={5}
                value={joinCode}
                onChange={e => setJoinCode(cleanRoom(e.target.value))}
                placeholder="CODE"
                aria-label="Raumcode"
              />
              <button disabled={!canJoin || !settings.playerName.trim()} onClick={() => canJoin && settings.playerName.trim() && openOnline(joinCode, 'guest')}>
                BEITRETEN
              </button>
            </div>
          </div>
        </div>

        <button className="dash-mode-button" onClick={() => setShowRules(true)}>
          <span className="dash-button-icon"><Gamepad2 /></span>
          <span>ANLEITUNG</span>
        </button>
      </section>

      <footer className="dash-home-footer">
        <div className="dash-ready-chip"><span className="status-dot done" /> Bereit für <b>{greeting}</b></div>
        <button className="dash-settings-button" onClick={() => setShowSettings(true)} aria-label="Einstellungen">
          <Settings2 />
        </button>
      </footer>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showSettings && <SettingsModal settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
      {showInstall && <InstallGuide onClose={() => setShowInstall(false)} />}
    </main>
  )
}
