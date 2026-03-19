const data = [
  { v: 120 },
  { v: 140 },
  { v: 135 },
  { v: 160 },
  { v: 150 },
  { v: 180 },
  { v: 170 },
]

function createSparklinePath(values: number[], width: number, height: number) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

export default function ChartVisits() {
  const values = data.map((item) => item.v)
  const width = 120
  const height = 32
  const linePath = createSparklinePath(values, width, height)
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#visits)" />
      <path d={linePath} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
