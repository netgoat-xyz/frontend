"use client"

import { AreaChart, Area } from "recharts"

const data = [
  { v: 120 },
  { v: 140 },
  { v: 135 },
  { v: 160 },
  { v: 150 },
  { v: 180 },
  { v: 170 },
]

export default function ChartVisits() {
  return (
    <AreaChart width={120} height={32} data={data}>
      <defs>
        <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopOpacity={0.6} />
          <stop offset="100%" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        dataKey="v"
        type="monotone"
        stroke="currentColor"
        fill="url(#visits)"
        strokeWidth={2}
      />
    </AreaChart>
  )
}
