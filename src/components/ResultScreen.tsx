import { Trophy, RotateCcw, Home } from 'lucide-react'
import type { PlayerState } from '../lib/types'
import { scoreTotals } from '../lib/scoring'

export default function ResultScreen({ players, onRematch, onHome, rematchHint }: { players: PlayerState[]; onRematch?: () => void; onHome: () => void; rematchHint?: string }) {
  const ranked = [...players].map(player => ({ player, total: scoreTotals(player.scoreCard).total })).sort((a,b)=>b.total-a.total)
  const best = ranked[0]?.total ?? 0
  const winners = ranked.filter(x => x.total === best)
  const winner = winners.length === 1 ? winners[0].player : null
  return <main className="result-screen screen-shell">
    <img className="result-brand-icon" src="/icons/icon-192.png" alt="Schmiddi & Schreier Spezial"/>
    <div className="result-trophy"><Trophy size={42}/></div>
    <span className="eyebrow">SCHMIDDI &amp; SCHREIER · BLOCK VOLL</span>
    <h1>{winner ? `${winner.name} gewinnt.` : 'Unentschieden.'}</h1>
    <p className="result-sub">{winner ? 'Schreien erlaubt.' : 'Das schreit nach Revanche.'}</p>
    <div className={`result-scores result-${Math.min(players.length,4)}`}>
      {ranked.map(({player,total}, index) => <div key={player.id} className={total === best ? 'winner' : ''}><span>{index + 1}. {player.name}</span><strong>{total}</strong></div>)}
    </div>
    {onRematch ? <button className="primary-button" onClick={onRematch}><RotateCcw/> REVANCHE</button> : <div className="waiting-banner">{rematchHint ?? 'Der Host kann eine Revanche starten.'}</div>}
    <button className="ghost-button" onClick={onHome}><Home/> Startseite</button>
  </main>
}
