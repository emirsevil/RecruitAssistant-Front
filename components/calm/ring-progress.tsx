type RingProgressProps = {
  value: number
  size?: number
  stroke?: number
  trackColor?: string
  fillColor?: string
  className?: string
}

export function RingProgress({
  value,
  size = 92,
  stroke = 7,
  trackColor = "var(--secondary)",
  fillColor = "var(--sage)",
  className,
}: RingProgressProps) {
  const r = size / 2 - stroke
  const c = 2 * Math.PI * r
  const safe = Math.max(0, Math.min(100, value))
  const off = c - (safe / 100) * c
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={fillColor}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  )
}
