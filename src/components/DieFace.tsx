interface Props {
  value: number
  held?: boolean
  rolling?: boolean
  index?: number
  onClick?: () => void
}

const pipMap: Record<number, number[]> = {
  1: [4], 2: [0,8], 3: [0,4,8], 4: [0,2,6,8], 5: [0,2,4,6,8], 6: [0,2,3,5,6,8]
}

export default function DieFace({ value, held = false, rolling = false, index = 0, onClick }: Props) {
  return (
    <button
      type="button"
      className={`die ${held ? 'is-held' : ''} ${rolling ? 'is-rolling' : ''}`}
      style={{ '--die-i': index, '--die-rest-rot': `${[-4, 3, -2, 4, -3][index % 5]}deg` } as React.CSSProperties}
      onClick={onClick}
      aria-label={`Würfel ${index + 1}: ${value}${held ? ', gehalten' : ''}`}
    >
      <span className="die-grid">
        {Array.from({length:9}, (_,i) => <span key={i} className={pipMap[value]?.includes(i) ? 'pip on' : 'pip'} />)}
      </span>
      {held && <span className="held-pill">HOLD</span>}
    </button>
  )
}
