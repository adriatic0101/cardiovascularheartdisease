import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownAZ, ArrowUpDown, Search } from 'lucide-react'
import type { CountyData, MapVariable } from '../types'
import { formatPValue, histogram, summarize, type DescriptiveSummary, type HistogramBin } from '../statistics'
import { ScatterAnalysis } from './ScatterAnalysis'

type Props = {
  counties: CountyData[]
  selected: CountyData
  onSelect: (county: CountyData) => void
}

type Direction = 'highest' | 'lowest'
type SortOrder = 'rate' | 'county'

const indicator = {
  povertyRate: { short: 'Poverty', label: 'Female poverty rate', unit: '%', color: '#087f7a' },
  mortalityRate: { short: 'Mortality', label: 'Female heart disease mortality', unit: 'per 100,000', color: '#dd7b2f' },
} satisfies Record<MapVariable, { short: string; label: string; unit: string; color: string }>

function DescriptiveTable({ stats }: { stats: ReturnType<typeof summarize> }) {
  const rows: Array<[string, keyof DescriptiveSummary]> = [
    ['Mean', 'mean'],
    ['Median', 'median'],
    ['Minimum', 'min'],
    ['Maximum', 'max'],
    ['Standard deviation', 'standardDeviation'],
    ['Range', 'range'],
  ]

  return (
    <article className="analysis-card overflow-hidden">
      <div className="analysis-card-heading">
        <p className="eyebrow">Descriptive statistics</p>
        <h3>County distributions at a glance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="statistics-table">
          <thead><tr><th>Measure</th><th>Female poverty (%)</th><th>Female mortality (per 100,000)</th></tr></thead>
          <tbody>
            {rows.map(([label, key]) => (
              <tr key={key}>
                <th>{label}</th>
                <td>{stats.poverty[key].toFixed(1)}</td>
                <td>{stats.mortality[key].toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="figure-caption">Standard deviations use all 58 observed California counties as the study population (denominator n).</p>
    </article>
  )
}

function RankingChart({ variable, counties, selected, onSelect }: Props & { variable: MapVariable }) {
  const [direction, setDirection] = useState<Direction>('highest')
  const [sortOrder, setSortOrder] = useState<SortOrder>('rate')
  const config = indicator[variable]
  const ranked = useMemo(() => {
    const ten = [...counties]
      .sort((a, b) => direction === 'highest' ? b[variable] - a[variable] : a[variable] - b[variable])
      .slice(0, 10)
    return sortOrder === 'county' ? ten.sort((a, b) => a.county.localeCompare(b.county)) : ten
  }, [counties, direction, sortOrder, variable])

  return (
    <article className="analysis-card">
      <div className="analysis-card-heading flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">County rankings</p>
          <h3>{config.label}</h3>
        </div>
        <div className="analysis-controls" aria-label={`${config.short} ranking options`}>
          <button className={direction === 'highest' ? 'active' : ''} onClick={() => setDirection('highest')}>Top 10</button>
          <button className={direction === 'lowest' ? 'active' : ''} onClick={() => setDirection('lowest')}>Bottom 10</button>
          <button className="sort-button" onClick={() => setSortOrder((order) => order === 'rate' ? 'county' : 'rate')} title="Change chart order">
            {sortOrder === 'rate' ? <ArrowUpDown size={14} /> : <ArrowDownAZ size={14} />} {sortOrder === 'rate' ? 'Rate' : 'County'}
          </button>
        </div>
      </div>
      <div className="h-[390px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ranked} layout="vertical" margin={{ top: 6, right: 30, bottom: 24, left: 20 }}>
            <CartesianGrid stroke="#e5ecef" strokeDasharray="3 4" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#607580', fontSize: 11 }}>
              <Label value={config.unit} position="bottom" offset={8} fill="#607580" fontSize={11} />
            </XAxis>
            <YAxis type="category" dataKey="county" width={86} tick={{ fill: '#274351', fontSize: 11 }} tickLine={false} />
            <Tooltip formatter={(value) => [`${Number(value ?? 0).toFixed(1)} ${config.unit}`, config.label]} labelFormatter={(label) => `${label} County`} />
            <Bar dataKey={variable} radius={[0, 5, 5, 0]} onClick={(point) => onSelect(point.payload as unknown as CountyData)}>
              {ranked.map((county) => <Cell key={county.fips} fill={county.fips === selected.fips ? '#f2b64b' : config.color} stroke={county.fips === selected.fips ? '#0b2d45' : 'none'} strokeWidth={2} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="figure-caption">Toggle highest or lowest counties; click a bar to select that county across the dashboard.</p>
    </article>
  )
}

function HistogramTooltip({ active, payload, unit }: { active?: boolean; payload?: Array<{ payload: HistogramBin }>; unit: string }) {
  if (!active || !payload?.length) return null
  const bin = payload[0].payload
  return <div className="chart-tooltip"><strong>{bin.lower.toFixed(1)}–{bin.upper.toFixed(1)} {unit}</strong><span>{bin.count} counties</span></div>
}

function DistributionChart({ title, values, selectedValue, unit, color }: { title: string; values: number[]; selectedValue: number; unit: string; color: string }) {
  const bins = useMemo(() => histogram(values), [values])
  return (
    <article className="analysis-card">
      <div className="analysis-card-heading"><p className="eyebrow">Distribution</p><h3>{title}</h3></div>
      <div className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 12, right: 12, bottom: 52, left: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke="#e5ecef" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="label" angle={-35} textAnchor="end" height={70} tick={{ fill: '#607580', fontSize: 10 }} interval={0} />
            <YAxis allowDecimals={false} tick={{ fill: '#607580', fontSize: 11 }}>
              <Label value="Counties" angle={-90} position="insideLeft" fill="#607580" fontSize={11} />
            </YAxis>
            <Tooltip content={<HistogramTooltip unit={unit} />} cursor={{ fill: '#e8f3f3' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {bins.map((bin, index) => {
                const containsSelected = selectedValue >= bin.lower && (index === bins.length - 1 ? selectedValue <= bin.upper : selectedValue < bin.upper)
                return <Cell key={bin.label} fill={containsSelected ? '#f2b64b' : color} stroke={containsSelected ? '#0b2d45' : 'none'} strokeWidth={2} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="figure-caption">Seven equal-width bins; labels show the observed-rate interval in {unit}. The highlighted bin contains the selected county.</p>
    </article>
  )
}

function CountyComparison({ counties, selected, onSelect }: Props) {
  const fallback = counties.find((county) => county.fips !== selected.fips) ?? counties[0]
  const [comparisonFips, setComparisonFips] = useState(fallback.fips)
  useEffect(() => {
    if (comparisonFips === selected.fips) {
      setComparisonFips((counties.find((county) => county.fips !== selected.fips) ?? selected).fips)
    }
  }, [comparisonFips, counties, selected])
  const comparison = counties.find((county) => county.fips === comparisonFips) ?? fallback

  const maximums = {
    povertyRate: Math.max(...counties.map((county) => county.povertyRate)),
    mortalityRate: Math.max(...counties.map((county) => county.mortalityRate)),
  }

  return (
    <article className="analysis-card comparison-card">
      <div className="analysis-card-heading">
        <p className="eyebrow">County comparison</p>
        <h3>Compare two counties</h3>
        <p>The first county follows selections made on the map, scatterplot, or ranking charts.</p>
      </div>
      <div className="comparison-selects">
        <label><span>Selected county</span><select value={selected.fips} onChange={(event) => onSelect(counties.find((county) => county.fips === event.target.value) ?? selected)}>{counties.map((county) => <option value={county.fips} key={county.fips}>{county.county}</option>)}</select></label>
        <span className="comparison-vs">vs.</span>
        <label><span>Comparison county</span><select value={comparison.fips} onChange={(event) => setComparisonFips(event.target.value)}>{counties.filter((county) => county.fips !== selected.fips).map((county) => <option value={county.fips} key={county.fips}>{county.county}</option>)}</select></label>
      </div>
      <div className="comparison-grid">
        {(['povertyRate', 'mortalityRate'] as MapVariable[]).map((variable) => {
          const config = indicator[variable]
          const difference = selected[variable] - comparison[variable]
          return (
            <div className="comparison-measure" key={variable}>
              <div className="flex items-end justify-between gap-4"><h4>{config.label}</h4><span>{difference >= 0 ? '+' : ''}{difference.toFixed(1)} difference</span></div>
              {[selected, comparison].map((county, index) => (
                <div className="comparison-row" key={county.fips}>
                  <p>{county.county}</p>
                  <div className="comparison-track"><i style={{ width: `${(county[variable] / maximums[variable]) * 100}%`, background: index === 0 ? config.color : '#91a5af' }} /></div>
                  <strong>{county[variable].toFixed(1)}{variable === 'povertyRate' ? '%' : ''}</strong>
                </div>
              ))}
              <p className="comparison-unit">{config.unit}</p>
            </div>
          )
        })}
      </div>
    </article>
  )
}

export function StatisticalAnalysis({ counties, selected, onSelect }: Props) {
  const stats = useMemo(() => summarize(counties), [counties])
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card"><p className="metric-label">Pearson’s r</p><p className="metric-value">{stats.r.toFixed(3)}</p><p className="metric-detail">Positive county-level association</p></div>
        <div className="metric-card"><p className="metric-label">R²</p><p className="metric-value">{stats.rSquared.toFixed(3)}</p><p className="metric-detail">{(stats.rSquared * 100).toFixed(1)}% of observed variation</p></div>
        <div className="metric-card"><p className="metric-label">OLS slope</p><p className="metric-value">{stats.slope.toFixed(2)}</p><p className="metric-detail">Deaths per 100,000 per +1 percentage point</p></div>
        <div className="metric-card"><p className="metric-label">OLS intercept</p><p className="metric-value">{stats.intercept.toFixed(2)}</p><p className="metric-detail">Model baseline · {formatPValue(stats.pValue)}</p></div>
      </div>

      <article className="analysis-card mt-6">
        <div className="analysis-card-heading flex flex-wrap items-center justify-between gap-4">
          <div><p className="eyebrow">Ordinary least squares</p><h3>Poverty and heart disease mortality</h3><p>Unweighted ecological regression · one observation per California county</p></div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select value={selected.fips} onChange={(event) => onSelect(counties.find((county) => county.fips === event.target.value) ?? selected)} className="county-select">
              {counties.map((county) => <option key={county.fips} value={county.fips}>{county.county} County</option>)}
            </select>
          </label>
        </div>
        <ScatterAnalysis counties={counties} selected={selected} onSelect={onSelect} />
        <div className="chart-key">
          <span><i className="bg-teal" />County estimate</span><span><i className="line-key bg-amber" />OLS fitted line</span><span><i className="selected-key bg-amber" />Selected: {selected.county}</span>
        </div>
        <p className="figure-caption">Figure 1. County-level female poverty and age-adjusted heart disease mortality rates. The fitted equation is ŷ = {stats.intercept.toFixed(2)} + {stats.slope.toFixed(2)}x; r = {stats.r.toFixed(3)}, R² = {stats.rSquared.toFixed(3)}, {formatPValue(stats.pValue)}, n = {stats.n}.</p>
      </article>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <DescriptiveTable stats={stats} />
        <article className="analysis-card interpretation-panel">
          <div className="analysis-card-heading"><p className="eyebrow">Regression interpretation</p><h3>What the model estimates</h3></div>
          <p>Pearson’s r of <strong>{stats.r.toFixed(3)}</strong> indicates a positive linear association across counties: higher poverty rates tend to coincide with higher mortality rates. R² = <strong>{stats.rSquared.toFixed(3)}</strong> means the bivariate model accounts for {(stats.rSquared * 100).toFixed(1)}% of observed county-to-county variation in mortality.</p>
          <p>The slope estimates <strong>{stats.slope.toFixed(2)} additional deaths per 100,000</strong> for a one-percentage-point increase in female poverty. The intercept ({stats.intercept.toFixed(2)}) is the predicted mortality rate at 0% poverty; because 0% lies outside the observed range, it is a mathematical model parameter rather than a substantively observed baseline.</p>
          <p>The calculated two-sided test is <strong>{formatPValue(stats.pValue)}</strong>. Statistical association does not establish causation, and the county-level result cannot be applied directly to individuals.</p>
        </article>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <RankingChart variable="povertyRate" counties={counties} selected={selected} onSelect={onSelect} />
        <RankingChart variable="mortalityRate" counties={counties} selected={selected} onSelect={onSelect} />
        <DistributionChart title="Female poverty rate" values={counties.map((county) => county.povertyRate)} selectedValue={selected.povertyRate} unit="percent" color="#087f7a" />
        <DistributionChart title="Female heart disease mortality" values={counties.map((county) => county.mortalityRate)} selectedValue={selected.mortalityRate} unit="deaths per 100,000" color="#dd7b2f" />
      </div>

      <div className="mt-6"><CountyComparison counties={counties} selected={selected} onSelect={onSelect} /></div>
    </>
  )
}
