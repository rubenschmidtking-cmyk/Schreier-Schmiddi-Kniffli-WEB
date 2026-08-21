import { useEffect, useState } from 'react'
import { RotateCcw, LockKeyhole } from 'lucide-react'
import type { Die } from '../lib/types'
import DieFace from './DieFace'
import { playRollSound } from '../lib/feedback'

interface Props {
  dice: Die[]
  rollsUsed: number
  submitted: boolean
  sound: boolean
  onRoll: () => void
  onRollStart?: () => void
  onToggle: (id: string) => void
  externalRolling?: boolean
}

export default function DiceTray({ dice, rollsUsed, submitted, sound, onRoll, onRollStart, onToggle, externalRolling = false }: Props) {
  const [rolling, setRolling] = useState(false)
  const [preview, setPreview] = useState(dice.map(d => d.value))

  useEffect(() => { if (!rolling) setPreview(dice.map(d => d.value)) }, [dice, rolling])

  const animateRoll = () => {
    if (submitted || rollsUsed >= 3 || rolling) return
    setRolling(true)
    onRollStart?.()
    playRollSound(sound)
    const timer = window.setInterval(() => setPreview(dice.map(d => d.held ? d.value : Math.floor(Math.random()*6)+1)), 52)
    window.setTimeout(() => {
      clearInterval(timer)
      setRolling(false)
      onRoll()
    }, 760)
  }

  const isRolling = rolling || externalRolling
  const canRoll = !submitted && rollsUsed < 3

  return (
    <section className="dice-tray" aria-label="Würfelbrett">
      <div className="tray-head">
        <span className="eyebrow">DEIN WURF</span>
        <span className="roll-counter">Wurf {Math.min(rollsUsed + (rolling ? 1 : 0), 3)}/3</span>
      </div>
      <div className="dice-row">
        {dice.map((die, i) => (
          <DieFace key={die.id} value={preview[i] ?? die.value} held={die.held} rolling={isRolling && !die.held} index={i} onClick={() => !rolling && onToggle(die.id)} />
        ))}
      </div>
      <div className="tray-hint"><LockKeyhole size={14} /> Antippen = halten · erneut tippen = lösen</div>
      <button className="roll-button" disabled={!canRoll || rolling} onClick={animateRoll}>
        <RotateCcw size={20} className={rolling ? 'spin' : ''} />
        {submitted ? 'EINGETRAGEN' : rollsUsed === 0 ? 'WÜRFELN' : rollsUsed < 3 ? `NOCHMAL WÜRFELN · ${3-rollsUsed}×` : 'KATEGORIE WÄHLEN'}
      </button>
    </section>
  )
}
