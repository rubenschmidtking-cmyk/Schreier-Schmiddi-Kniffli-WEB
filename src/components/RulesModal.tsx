import { X } from 'lucide-react'
import { categories } from '../lib/types'
import { categoryMeta } from '../lib/rules'

export default function RulesModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal-card" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow dark">REGELWERK</span><h2>Bis der Block voll ist.</h2></div><button className="icon-button dark" onClick={onClose}><X /></button></div>
      <p>Oben bleibt Kniffel klassisch. Ab <strong>63 Punkten</strong> gibt es <strong>35 Bonuspunkte</strong>. Wertest du eine gültige Kategorie im <strong>unteren Teil direkt nach dem 1. Wurf</strong>, bekommst du <strong>+5 Punkte</strong>.</p>
      <div className="rules-grid">
        {categories.map(c => <div className="rule-item" key={c}><div><strong>{categoryMeta[c].title}</strong><span>{categoryMeta[c].description}</span></div><b>{categoryMeta[c].hint ?? 'variabel'}</b></div>)}
      </div>
    </section>
  </div>
}
