import { Share, PlusSquare, X } from 'lucide-react'
export default function InstallGuide({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="modal-card install-card" onClick={e=>e.stopPropagation()}>
    <div className="modal-head"><div><span className="eyebrow dark">IPHONE</span><h2>Wie eine App installieren</h2></div><button className="icon-button dark" onClick={onClose}><X/></button></div>
    <div className="install-step"><b>1</b><div><strong>In Safari öffnen</strong><span>Die Installation als Home-Screen-App erfolgt auf dem iPhone über Safari.</span></div></div>
    <div className="install-step"><b>2</b><Share/><div><strong>Teilen drücken</strong><span>Unten in Safari auf das Teilen-Symbol tippen.</span></div></div>
    <div className="install-step"><b>3</b><PlusSquare/><div><strong>„Zum Home-Bildschirm“</strong><span>Hinzufügen – danach startet Kniffli im eigenen Vollbildfenster.</span></div></div>
  </section></div>
}
