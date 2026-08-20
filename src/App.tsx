import { useEffect, useMemo, useState } from 'react'
import { Bot, BookOpen, Download, Gamepad2, Globe2, Settings2, Sparkles, Users2 } from 'lucide-react'
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
    try { localStorage.setItem(roleStorageKey(clean), role) } catch {}
    setScreen({ kind: 'online', code: clean, role })
  }
  const canJoin = joinCode.length === 5
  const greeting = useMemo(() => settings.playerName.trim() || 'Spieler 1', [settings.playerName])

  if (screen.kind === 'cpu') return <GameScreen settings={settings} onExit={home} />
  if (screen.kind === 'local') return <LocalGameScreen settings={settings} onExit={home} />
  if (screen.kind === 'online') return <OnlineMatch code={screen.code} role={screen.role} settings={settings} onExit={home} />

  return (
    <main className="home-screen screen-shell">
      <div className="home-grain" aria-hidden="true" />
      <header className="home-topbar">
        <button className="round-action" onClick={() => setShowRules(true)} aria-label="Regeln"><BookOpen /></button>
        <div className="brand-mini">S&amp;S</div>
        <button className="round-action" onClick={() => setShowSettings(true)} aria-label="Einstellungen"><Settings2 /></button>
      </header>

      <section className="hero classic-hero">
        <img className="hero-app-icon" src="/icons/icon-512.png" alt="Schmiddi & Schreier Spezial App Icon" />
        <div className="hero-copy">
          <span className="eyebrow brand-eyebrow"><Sparkles size={13}/> DAS SCHMIDDI &amp; SCHREIER SPEZIAL</span>
          <h1><span>SCHMIDDI</span><span>&amp; SCHREIER</span><em>SPEZIAL</em></h1>
          <p>Das Spezial-Kniffli für 1–4 Spieler. Gespielt wird, bis der Block wirklich voll ist · 5 Würfel · maximal 3 Würfe.</p><div className="hero-chips"><span>🎲 Block komplett</span><span>⚡ 1. Wurf +5</span><span>📱 iPhone optimiert</span></div>
        </div>
      </section>

      <section className="mode-stack" aria-label="Spielmodus wählen"><div className="section-kicker">SPIELMODUS</div>
        <button className="mode-card primary-mode" onClick={() => setScreen({ kind: 'cpu' })}>
          <span className="mode-icon"><Bot /></span>
          <span><small>SOFORT SPIELEN</small><strong>Gegen Schmiddi CPU</strong><em>Easy · Normal · Psycho</em></span>
          <Gamepad2 className="mode-arrow" />
        </button>

        <div className="online-card">
          <div className="online-card-head">
            <span className="mode-icon"><Globe2 /></span>
            <span><small>2–4 iPHONES · LIVE</small><strong>Online mit bis zu 4 Spielern</strong></span>
          </div>
          <div className="online-actions">
            <label className="online-name-field"><span>DEIN NAME</span><input value={settings.playerName} maxLength={16} autoComplete="nickname" placeholder="z. B. Ruben" onChange={e => setSettings({...settings, playerName:e.target.value})}/></label>
            <button className="secondary-button" disabled={!settings.playerName.trim()} onClick={() => openOnline(randomRoomCode(), 'host')}><Users2 /> Raum erstellen</button>
            <div className="join-row">
              <input inputMode="text" autoCapitalize="characters" autoCorrect="off" maxLength={5} value={joinCode} onChange={e => setJoinCode(cleanRoom(e.target.value))} placeholder="CODE" aria-label="Raumcode" />
              <button disabled={!canJoin || !settings.playerName.trim()} onClick={() => canJoin && settings.playerName.trim() && openOnline(joinCode, 'guest')}>BEITRETEN</button>
            </div>
          </div>
        </div>

        <button className="mode-card compact-mode" onClick={() => setScreen({ kind: 'local' })}>
          <span className="mode-icon"><Users2 /></span>
          <span><small>EIN iPHONE</small><strong>Pass & Play</strong><em>Abwechselnd spielen</em></span>
        </button>
      </section>

      <section className="home-footer-card">
        <div><span className="status-dot done" /><span>Bereit für <b>{greeting}</b></span></div>
        <button onClick={() => setShowInstall(true)}><Download /> Auf iPhone installieren</button>
      </section>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showSettings && <SettingsModal settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
      {showInstall && <InstallGuide onClose={() => setShowInstall(false)} />}
    </main>
  )
}
