import type { PlayerState, ScoreCategory } from '../lib/types'
import { lowerCategories, upperCategories } from '../lib/types'
import { categoryMeta } from '../lib/rules'
import { filledCount, firstRollBonus, scoreCategory, scoreTotals } from '../lib/scoring'

interface Props {
  me: PlayerState
  opponents?: PlayerState[]
  opponent?: PlayerState
  myLabel?: string
  opponentLabel?: string
  allowScoring: boolean
  onScore: (category: ScoreCategory) => void
}

export default function ScoreSheet({ me, opponents, opponent, myLabel, opponentLabel, allowScoring, onScore }: Props) {
  const others = opponents ?? (opponent ? [opponent] : [])
  const players = [me, ...others]
  const labels = [myLabel ?? me.name, ...others.map((p, i) => i === 0 && opponentLabel ? opponentLabel : p.name)]
  const diceValues = me.dice.map(d => d.value)
  const totals = players.map(p => scoreTotals(p.scoreCard))
  const openCandidates = [...upperCategories, ...lowerCategories]
    .filter(c => typeof me.scoreCard[c] !== 'number')
    .map(c => ({ c, v: me.rollsUsed > 0 ? scoreCategory(c, diceValues, me.rollsUsed) : 0 }))
  const bestCandidate = openCandidates.reduce((best, x) => x.v > best.v ? x : best, { c: null as ScoreCategory | null, v: -1 }).c

  const scoreCell = (category: ScoreCategory, player: PlayerState, mine: boolean) => {
    const fixed = player.scoreCard[category]
    if (typeof fixed === 'number') return <span className={fixed === 0 ? 'score-zero' : 'score-fixed'}>{fixed}</span>
    if (mine && allowScoring && me.rollsUsed > 0 && !me.submitted) {
      const candidate = scoreCategory(category, diceValues, me.rollsUsed)
      const bonus = firstRollBonus(category, diceValues, me.rollsUsed)
      return <button aria-label={`${categoryMeta[category].title}: ${candidate} Punkte eintragen`} className={`candidate ${candidate === 0 ? 'zero' : ''} ${bonus ? 'first-roll-bonus' : ''} ${bestCandidate === category && candidate > 0 ? 'best-candidate' : ''}`} onClick={() => onScore(category)}>{candidate > 0 ? <><span>+{candidate}</span>{bestCandidate === category && <small className="best-label">BESTE OPTION</small>}{bonus > 0 && <small>1. WURF +5</small>}</> : '0'}</button>
    }
    return <span className="empty-score">—</span>
  }

  const row = (category: ScoreCategory) => (
    <tr key={category}>
      <th scope="row"><span>{categoryMeta[category].title}</span>{categoryMeta[category].hint && <small>{categoryMeta[category].hint}</small>}</th>
      {players.map((player, index) => <td key={player.id} className={index === 0 ? 'my-score' : ''}>{scoreCell(category, player, index === 0)}</td>)}
    </tr>
  )

  const colSpan = players.length + 1
  return (
    <section className={`score-sheet player-columns-${players.length}`}>
      <div className="paper-title">
        <div><span className="tiny-label">ORIGINAL HAUSREGELN</span><h2>Schmiddi &amp; Schreier Dice Dash</h2><small className="sheet-progress">{filledCount(me.scoreCard)} von {upperCategories.length + lowerCategories.length} Feldern</small></div>
        <div className="mini-die">⚄</div>
      </div>
      <div className="score-table-scroll">
        <table>
          <thead><tr><th>Kategorie</th>{labels.map((label, i) => <th key={`${players[i].id}-${i}`} className={i === 0 ? 'active-col' : ''}>{i === 0 ? 'DU' : label.slice(0,8)}</th>)}</tr></thead>
          <tbody>
            <tr className="section-row"><th colSpan={colSpan}>OBERER TEIL</th></tr>
            {upperCategories.map(row)}
            <tr className="summary-row"><th>Summe oben</th>{totals.map((t,i)=><td key={players[i].id}>{t.upperSubtotal}</td>)}</tr>
            <tr className="summary-row"><th>Bonus ab 63 <small>+35</small></th>{totals.map((t,i)=><td key={players[i].id}>{t.bonus}</td>)}</tr>
            <tr className="summary-row strong"><th>Gesamt oben</th>{totals.map((t,i)=><td key={players[i].id}>{t.upperTotal}</td>)}</tr>
            <tr className="section-row"><th colSpan={colSpan}>UNTERER TEIL · 1. WURF = +5</th></tr>
            {lowerCategories.map(row)}
            <tr className="summary-row strong"><th>Gesamt unten</th>{totals.map((t,i)=><td key={players[i].id}>{t.lowerTotal}</td>)}</tr>
            <tr className="grand-total"><th>GESAMTPUNKTE</th>{totals.map((t,i)=><td key={players[i].id}>{t.total}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
