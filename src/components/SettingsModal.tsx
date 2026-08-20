import { X } from 'lucide-react'
import type { Settings } from '../lib/types'
import { requestMotionPermission } from '../hooks/useShakeToRoll'

interface Props { settings: Settings; onChange: (s: Settings) => void; onClose: () => void }
export default function SettingsModal({ settings, onChange, onClose }: Props) {
  const toggleShake = async () => {
    if (!settings.shakeToRoll) {
      const granted = await requestMotionPermission()
      if (!granted) { alert('Bewegungszugriff wurde nicht erlaubt. Du kannst weiterhin über den Button würfeln.'); return }
    }
    onChange({ ...settings, shakeToRoll: !settings.shakeToRoll })
  }
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal-card settings-card" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow dark">SETTINGS</span><h2>Dein Kniffli</h2></div><button className="icon-button dark" onClick={onClose}><X /></button></div>
      <label className="field-label">Dein Name<input value={settings.playerName} maxLength={16} onChange={e => onChange({...settings, playerName: e.target.value})} /></label>
      <label className="setting-row"><span><strong>Sound</strong><small>Würfel & Score Feedback</small></span><input type="checkbox" checked={settings.sound} onChange={e => onChange({...settings, sound:e.target.checked})}/></label>
      <button className="setting-row button-row" onClick={toggleShake}><span><strong>Shake to Roll</strong><small>iPhone schütteln zum Würfeln</small></span><span className={`switch ${settings.shakeToRoll ? 'on' : ''}`}><i /></span></button>
      <label className="field-label">CPU Schwierigkeit<select value={settings.cpuDifficulty} onChange={e => onChange({...settings, cpuDifficulty:e.target.value as Settings['cpuDifficulty']})}><option value="easy">Easy</option><option value="normal">Normal</option><option value="psycho">Psycho</option></select></label>
    </section>
  </div>
}
