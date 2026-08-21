import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Bot } from 'lucide-react'
import type { PlayerState, ScoreCategory, Settings } from '../lib/types'
import { createPlayer, resetRound, rollDice, submitCategory, toggleDie } from '../lib/game'
import { playCpuRound } from '../lib/cpu'
import { playScoreTone, softVibrate } from '../lib/feedback'
import { filledCount, isScoreCardComplete, scoreCategory, scoreTotals } from '../lib/scoring'
import { TOTAL_ROUNDS } from '../lib/rules'
import { useShakeToRoll } from '../hooks/useShakeToRoll'
import DiceTray from './DiceTray'
import ScoreSheet from './ScoreSheet'
import ResultScreen from './ResultScreen'
import Confetti from './Confetti'

interface Props { settings: Settings; onExit: () => void }

export default function GameScreen({ settings, onExit }: Props) {
  const makePlayers = () => [createPlayer(settings.playerName.trim() || 'Spieler 1'), createPlayer('Schmiddi CPU')] as [PlayerState, PlayerState]
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>(makePlayers)
  const [round, setRound] = useState(1)
  const [cpuStatus, setCpuStatus] = useState('macht sich bereit')
  const [advancing, setAdvancing] = useState(false)
  const advancingRef = useRef(false)
  const [finished, setFinished] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const me = players[0]
  const cpu = players[1]
  const myTotal = scoreTotals(me.scoreCard).total
  const cpuTotal = scoreTotals(cpu.scoreCard).total

  const roll = () => {
    if (me.submitted || me.rollsUsed >= 3) return
    softVibrate(12)
    setPlayers(p => [rollDice(p[0]), p[1]])
  }
  useShakeToRoll(settings.shakeToRoll, roll)

  useEffect(() => {
    if (finished || cpu.submitted) return
    setCpuStatus('würfelt …')
    const t1 = window.setTimeout(() => setCpuStatus('überlegt …'), 520)
    const t2 = window.setTimeout(() => {
      setPlayers(p => {
        if (p[1].submitted) return p
        const result = playCpuRound(p[1], settings.cpuDifficulty)
        setCpuStatus(`${result.category === 'kniffli' ? 'DICE DASH!' : 'hat eingetragen'} · ${result.points} P.`)
        return [p[0], result.player]
      })
    }, 1050 + Math.random() * 450)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [round, finished]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!me.submitted || !cpu.submitted || advancingRef.current || finished) return

    advancingRef.current = true
    setAdvancing(true)

    const timer = window.setTimeout(() => {
      if (isScoreCardComplete(players[0].scoreCard) && isScoreCardComplete(players[1].scoreCard)) {
        setFinished(true)
      } else {
        setPlayers(p => [resetRound(p[0]), resetRound(p[1])])
        setRound(r => r + 1)
        setCpuStatus('macht sich bereit')
      }

      advancingRef.current = false
      setAdvancing(false)
    }, 1050)

    return () => clearTimeout(timer)
  }, [me.submitted, cpu.submitted, round, finished])

  const potential = useMemo(() => Object.fromEntries(Object.keys(me.scoreCard).map(c => [c, scoreCategory(c as ScoreCategory, me.dice.map(d => d.value), me.rollsUsed)])), [me.dice, me.scoreCard])

  const score = (category: ScoreCategory) => {
    const points = potential[category]
    if (points === 0 && !window.confirm(`„${category}“ mit 0 Punkten streichen?`)) return
    const result = submitCategory(me, category)
    if (result.player === me) return
    setPlayers(p => [result.player, p[1]])
    playScoreTone(settings.sound, category === 'kniffli' && result.points >= 50)
    softVibrate(category === 'kniffli' && result.points >= 50 ? [25,40,25] : 18)
    if (category === 'kniffli' && result.points >= 50) {
      setConfetti(true)
      window.setTimeout(() => setConfetti(false), 1800)
    }
  }

  const rematch = () => { advancingRef.current = false; setPlayers(makePlayers()); setRound(1); setFinished(false); setAdvancing(false); setCpuStatus('macht sich bereit') }
  if (finished) return <ResultScreen players={players} onRematch={rematch} onHome={onExit} />

  return <main className="game-screen screen-shell dice-dash-screen">
    <Confetti active={confetti} />
    <header className="game-header">
      <button className="icon-button" onClick={onExit} aria-label="Zurück"><ChevronLeft/></button>
      <div className="round-badge"><small>SPIELZUG</small><strong>{round}</strong></div>
      <div className="top-score"><small>{me.name}</small><strong>{myTotal}</strong></div>
      <div className="top-score opponent"><small>Schmiddi</small><strong>{cpuTotal}</strong></div>
    </header>
    <div className="game-brand-strip dash-brand-strip"><img src="/brand/dice-dash-logo.png" alt="Schmiddi &amp; Schreier Dice Dash"/><span><b>SCHMIDDI &amp; SCHREIER</b><small>DICE DASH · {filledCount(me.scoreCard)}/{TOTAL_ROUNDS} FELDER</small></span></div>
    <div className="game-progress" aria-label={`${filledCount(me.scoreCard)} von ${TOTAL_ROUNDS} Feldern ausgefüllt`}><span style={{ width: `${Math.round((filledCount(me.scoreCard)/TOTAL_ROUNDS)*100)}%` }} /></div>
    <div className="turn-guide">
      <span className={me.rollsUsed === 0 ? 'active' : 'done'}>1 · WÜRFELN</span>
      <i>›</i>
      <span className={me.rollsUsed > 0 && !me.submitted ? 'active' : me.submitted ? 'done' : ''}>2 · HALTEN</span>
      <i>›</i>
      <span className={me.submitted ? 'done' : me.rollsUsed > 0 ? 'active' : ''}>3 · EINTRAGEN</span>
    </div>
    <div className="cpu-strip"><Bot size={16}/><span><b>Schmiddi CPU</b> {cpuStatus}</span><i className={cpu.submitted ? 'status-dot done' : 'status-dot'} /></div>
    <DiceTray dice={me.dice} rollsUsed={me.rollsUsed} submitted={me.submitted} sound={settings.sound} onRoll={roll} onToggle={id => setPlayers(p => [toggleDie(p[0], id), p[1]])}/>
    {me.submitted && !cpu.submitted && <div className="waiting-banner">Du bist fertig · Schmiddi ist noch dran</div>}
    {advancing && <div className="waiting-banner success">Runde komplett ✓</div>}
    <ScoreSheet me={me} opponent={cpu} myLabel="DU" opponentLabel="CPU" allowScoring={!advancing} onScore={score}/>
  </main>
}
