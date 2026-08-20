export default function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return <div className="confetti" aria-hidden="true">{Array.from({length:34},(_,i) => <i key={i} style={{'--c-i': i} as React.CSSProperties} />)}</div>
}
