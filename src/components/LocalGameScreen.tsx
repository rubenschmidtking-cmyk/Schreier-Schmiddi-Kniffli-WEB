import { useMemo, useState } from 'react'
import { ChevronLeft, Users2 } from 'lucide-react'
import type { PlayerState, ScoreCategory, Settings } from '../lib/types'
import { createPlayer, resetRound, rollDice, submitCategory, toggleDie } from '../lib/game'
import { filledCount, isScoreCardComplete, scoreCategory, scoreTotals } from '../lib/scoring'
import { TOTAL_ROUNDS } from '../lib/rules'
import { playScoreTone, softVibrate } from '../lib/feedback'
import DiceTray from './DiceTray'
import ScoreSheet from './ScoreSheet'
import ResultScreen from './ResultScreen'
import Confetti from './Confetti'

export default function LocalGameScreen({ settings, onExit }: { settings: Settings; onExit: () => void }) {
  const makePlayers = () => [createPlayer(settings.playerName.trim() || 'Spieler 1'), createPlayer('Spieler 2')] as [PlayerState, PlayerState]
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>(makePlayers)
  const [active, setActive] = useState<0 | 1>(0)
  const [round, setRound] = useState(1)
  const [handover, setHandover] = useState(false)
  const [finished, setFinished] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const me = players[active]
  const other = players[active === 0 ? 1 : 0]
  const potential = useMemo(() => Object.fromEntries(Object.keys(me.scoreCard).map(c => [c, scoreCategory(c as ScoreCategory, me.dice.map(d => d.value), me.rollsUsed)])), [me])

  const roll = () => {
    if (me.submitted || me.rollsUsed >= 3) return
    softVibrate(12)
    setPlayers(prev => {
      const next: [PlayerState, PlayerState] = [...prev]
      next[active] = rollDice(next[active])
      return next
    })
  }

  const score = (category: ScoreCategory) => {
    const points = potential[category]
    if (points === 0 && !window.confirm('Dieses Feld mit 0 Punkten streichen?')) return
    const result = submitCategory(me, category)
    setPlayers(prev => {
      const next: [PlayerState, PlayerState] = [...prev]
      next[active] = result.player
      return next
    })
    playScoreTone(settings.sound, category === 'kniffli' && result.points >= 50)
    if (category === 'kniffli' && result.points >= 50) { setConfetti(true); setTimeout(() => setConfetti(false), 1700) }
    setTimeout(() => {
      if (active === 0) {
        setActive(1); setHandover(true)
      } else if (isScoreCardComplete(players[0].scoreCard) && isScoreCardComplete(result.player.scoreCard)) {
        setFinished(true)
      } else {
        setPlayers(prev => [resetRound(prev[0]), resetRound(prev[1])])
        setActive(0); setRound(r => r + 1); setHandover(true)
      }
    }, 450)
  }

  const rematch = () => { setPlayers(makePlayers()); setActive(0); setRound(1); setFinished(false); setHandover(false) }
  if (finished) return <ResultScreen players={players} onRematch={rematch} onHome={onExit} />

  if (handover) return <main className="handover-screen screen-shell">
    <div className="handover-icon"><Users2 /></div>
    <span className="eyebrow">PASS & PLAY</span>
    <h1>iPhone an<br/><em>{players[active].name}</em></h1>
    <p>Keine Sorge: Die Würfel des anderen Spielers sind für die nächste Runde zurückgesetzt.</p>
    <button className="primary-button" onClick={() => setHandover(false)}>ICH BIN BEREIT</button>
  </main>

  return <main className="game-screen screen-shell">
    <Confetti active={confetti}/>
    <header className="game-header">
      <button className="icon-button" onClick={onExit}><ChevronLeft/></button>
      <div className="round-badge"><small>SPIELZUG</small><strong>{round}</strong></div>
      <div className="top-score"><small>{players[0].name}</small><strong>{scoreTotals(players[0].scoreCard).total}</strong></div>
      <div className="top-score opponent"><small>{players[1].name}</small><strong>{scoreTotals(players[1].scoreCard).total}</strong></div>
    </header>
    <div className="game-brand-strip"><img src="/icons/icon-192.png" alt=""/><span><b>SCHMIDDI &amp; SCHREIER</b><small>SPEZIAL · {filledCount(players[0].scoreCard)}/{TOTAL_ROUNDS} FELDER</small></span></div>
    <div className="cpu-strip"><Users2 size={16}/><span><b>{me.name}</b> ist dran</span><i className="status-dot done"/></div>
    <DiceTray dice={me.dice} rollsUsed={me.rollsUsed} submitted={me.submitted} sound={settings.sound} onRoll={roll} onToggle={id => setPlayers(prev => {
      const next: [PlayerState, PlayerState] = [...prev]; next[active] = toggleDie(next[active], id); return next
    })}/>
    <ScoreSheet me={me} opponent={other} myLabel="DU" opponentLabel={other.name.toUpperCase().slice(0,8)} allowScoring onScore={score}/>
  </main>
}
