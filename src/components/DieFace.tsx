interface Props {
  value: number
  held?: boolean
  rolling?: boolean
  index?: number
  onClick?: () => void
}

type PipPosition =
  | 'top-left'
  | 'top-right'
  | 'mid-left'
  | 'mid-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right'

const faceMap: Record<number, PipPosition[]> = {
  1: ['center'],
  2: ['top-left', 'bottom-right'],
  3: ['top-left', 'center', 'bottom-right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right'],
}

export default function DieFace({ value, held = false, rolling = false, index = 0, onClick }: Props) {
  const pips = faceMap[Math.min(6, Math.max(1, value))] ?? faceMap[1]

  return (
    <button
      type="button"
      className={`die ${held ? 'is-held' : ''} ${rolling ? 'is-rolling' : ''}`}
      style={{ '--die-i': index, '--die-rest-rot': `${[-4, 3, -2, 4, -3][index % 5]}deg` } as React.CSSProperties}
      onClick={onClick}
      aria-label={`Würfel ${index + 1}: ${value}${held ? ', gehalten' : ''}`}
    >
      <span className={`die-face value-${value}`}>
        {pips.map((spot, pipIndex) => (
          <span key={`${value}-${spot}-${pipIndex}`} className={`pip-real ${spot}`} />
        ))}
      </span>
      {held && <span className="held-pill">HOLD</span>}
    </button>
  )
}
