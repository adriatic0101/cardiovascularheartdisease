import { CartesianGrid, Cell, ComposedChart, Label, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import type { CountyData } from '../types'
import { summarize } from '../statistics'

type Props = {
  counties: CountyData[]
  selected: CountyData
  onSelect: (county: CountyData) => void
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CountyData }> }) {
  if (!active || !payload?.length) return null
  const county = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="font-semibold text-navy">{county.county} County</p>
      <p className="mt-1 text-sm text-slate-600">Poverty: {county.povertyRate.toFixed(1)}%</p>
      <p className="text-sm text-slate-600">Mortality: {county.mortalityRate.toFixed(1)} per 100,000</p>
    </div>
  )
}

export function ScatterAnalysis({ counties, selected, onSelect }: Props) {
  const stats = summarize(counties)
  const minX = Math.floor(stats.povertyMin - 1)
  const maxX = Math.ceil(stats.povertyMax + 1)
  const regressionLine = [
    { povertyRate: minX, mortalityRate: stats.intercept + stats.slope * minX },
    { povertyRate: maxX, mortalityRate: stats.intercept + stats.slope * maxX },
  ]

  return (
    <div className="h-[470px] w-full" aria-label="Scatterplot of county poverty and mortality rates">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 18, right: 22, bottom: 56, left: 26 }}>
          <CartesianGrid stroke="#dbe5e8" strokeDasharray="3 4" vertical={false} />
          <XAxis type="number" dataKey="povertyRate" domain={[minX, maxX]} tick={{ fill: '#536875', fontSize: 12 }} stroke="#9aabb3">
            <Label value="Women 35+ below poverty (%)" position="bottom" offset={34} fill="#274351" fontSize={13} />
          </XAxis>
          <YAxis type="number" dataKey="mortalityRate" domain={[110, 310]} tick={{ fill: '#536875', fontSize: 12 }} stroke="#9aabb3">
            <Label value="Deaths per 100,000" angle={-90} position="insideLeft" offset={-12} fill="#274351" fontSize={13} />
          </YAxis>
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#8ca4ad', strokeDasharray: '3 3' }} />
          <Line data={regressionLine} type="linear" dataKey="mortalityRate" stroke="#ef9f35" strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />
          <Scatter data={counties} onClick={(point) => onSelect(point as CountyData)} isAnimationActive={false}>
            {counties.map((county) => (
              <Cell
                key={county.fips}
                fill={county.fips === selected.fips ? '#f2b64b' : '#087f7a'}
                stroke={county.fips === selected.fips ? '#0b2d45' : '#ffffff'}
                strokeWidth={county.fips === selected.fips ? 2.5 : 1.2}
              />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
