import { useCallback, useMemo, useState } from 'react'
import {
  ArrowDown,
  BookOpen,
  Database,
  ExternalLink,
  HeartPulse,
  Info,
  MapPinned,
  Scale,
  Search,
  ShieldAlert,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import countyJson from './data/counties.json'
import { CountyMap } from './components/CountyMap'
import { ScatterAnalysis } from './components/ScatterAnalysis'
import { summarize } from './statistics'
import type { CountyData, MapVariable } from './types'

const counties = countyJson as CountyData[]

const sections = [
  ['introduction', 'Introduction'],
  ['background', 'Background'],
  ['data-sources', 'Data & Variables'],
  ['methodology', 'Methodology'],
  ['map', 'Map'],
  ['analysis', 'Analysis'],
  ['results', 'Results'],
  ['limitations', 'Limitations'],
  ['discussion', 'Discussion'],
  ['references', 'References'],
] as const

const formatNumber = new Intl.NumberFormat('en-US')

function SectionHeading({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 grid gap-4 lg:grid-cols-[9rem_1fr]">
      <div className="flex items-start gap-3 pt-1">
        <span className="text-sm font-bold tracking-[0.18em] text-teal">{number}</span>
        <span className="mt-2 h-px w-10 bg-teal/50" />
      </div>
      <div className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {children && <div className="mt-5 text-lg leading-8 text-slate-600">{children}</div>}
      </div>
    </div>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-l border-white/20 pl-5">
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-teal-100">{label}</p>
      <p className="mt-1 text-xs text-slate-300">{detail}</p>
    </div>
  )
}

function App() {
  const stats = useMemo(() => summarize(counties), [])
  const initialCounty = counties.find((county) => county.county === 'Fresno') ?? counties[0]
  const [selected, setSelected] = useState<CountyData>(initialCounty)
  const [mapVariable, setMapVariable] = useState<MapVariable>('povertyRate')
  const handleSelect = useCallback((county: CountyData) => setSelected(county), [])

  const highPoverty = [...counties].sort((a, b) => b.povertyRate - a.povertyRate).slice(0, 5)
  const highMortality = [...counties].sort((a, b) => b.mortalityRate - a.mortalityRate).slice(0, 5)

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 hero-grid opacity-25" />
        <div className="absolute -right-28 top-20 h-[34rem] w-[34rem] rounded-full border border-teal-300/15" />
        <div className="absolute -right-10 top-40 h-[22rem] w-[22rem] rounded-full border border-teal-300/15" />
        <div className="relative mx-auto max-w-[1320px] px-5 pb-12 pt-8 md:px-10 md:pb-16 lg:px-16 lg:pb-20">
          <div className="flex items-center justify-between border-b border-white/15 pb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-teal-300/40 bg-teal-300/10">
                <HeartPulse size={20} className="text-teal-200" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">California County Health</p>
                <p className="mt-0.5 text-xs text-slate-300">Interactive Research Dashboard</p>
              </div>
            </div>
            <p className="hidden text-xs uppercase tracking-[0.17em] text-slate-300 md:block">ACS 2020–2024 · CDC 2022–2024</p>
          </div>

          <div className="grid gap-12 pb-8 pt-16 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:pt-24">
            <div>
              <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-teal-200">
                <span className="h-px w-8 bg-teal-300" /> Ecological analysis · 58 counties
              </p>
              <h1 className="max-w-5xl font-serif text-[clamp(2.65rem,6.2vw,5.8rem)] leading-[0.98] tracking-[-0.035em] text-white">
                The Relationship Between <span className="text-teal-200">Poverty</span> and Heart Disease Mortality
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">
                Among women ages 35 and older across California counties
              </p>
            </div>
            <div className="border-l border-teal-300/50 pl-6 lg:mb-2">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Research question</p>
              <p className="mt-4 font-serif text-xl leading-8 text-white md:text-2xl">
                To what extent are poverty rates among women ages 35+ associated with heart disease mortality rates among women ages 35+ across California’s 58 counties?
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="California counties" value="58" detail="Complete county coverage" />
            <StatCard label="Pearson correlation" value={`r = ${stats.r.toFixed(2)}`} detail="Unweighted county-level estimate" />
            <StatCard label="Explained variation" value={`${(stats.rSquared * 100).toFixed(1)}%`} detail="Simple linear model R²" />
            <StatCard label="Analytic population" value="Women 35+" detail="Aligned sex and age scope" />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur" aria-label="Research sections">
        <div className="mx-auto flex max-w-[1320px] items-center overflow-x-auto px-5 md:px-10 lg:px-16">
          <a href="#introduction" className="mr-7 shrink-0 py-4 font-serif text-sm font-bold text-navy">Poverty × Heart Health</a>
          <div className="flex min-w-max gap-1">
            {sections.map(([id, label], index) => (
              <a key={id} href={`#${id}`} className="nav-link">
                <span className="mr-1.5 text-[10px] text-teal">{String(index + 1).padStart(2, '0')}</span>{label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main>
        <section id="introduction" className="section-shell pt-24">
          <SectionHeading number="01" eyebrow="Introduction" title="Economic conditions and cardiovascular health are unevenly distributed.">
            This study examines whether California counties with higher poverty rates among women ages 35 and older also have higher female heart disease mortality rates. The county is the unit of analysis; the findings describe places, not individual risk.
          </SectionHeading>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
            {[
              [UsersRound, 'Population', 'Women ages 35 and older', 'Both measures are restricted to the same sex and broad age population.'],
              [MapPinned, 'Geography', 'California’s 58 counties', 'County-level estimates make geographic differences visible and comparable.'],
              [TrendingUp, 'Relationship', 'Poverty and mortality', 'A bivariate ecological analysis summarizes direction, strength, and linear fit.'],
            ].map(([Icon, label, title, text]) => {
              const CardIcon = Icon as typeof UsersRound
              return (
                <article key={String(label)} className="research-card">
                  <CardIcon className="text-teal" size={24} />
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-teal">{String(label)}</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-navy">{String(title)}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{String(text)}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="background" className="section-shell bg-mist">
          <SectionHeading number="02" eyebrow="Background and Research Significance" title="Place-based analysis can identify patterns that statewide averages conceal.">
            Poverty can shape access to preventive care, medication, stable housing, nutritious food, transportation, and other conditions relevant to cardiovascular health. Examining county patterns helps identify where socioeconomic disadvantage and mortality burdens overlap.
          </SectionHeading>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-navy p-8 text-white md:p-10">
              <p className="eyebrow !text-teal-200">Analytic premise</p>
              <blockquote className="mt-4 max-w-2xl font-serif text-2xl leading-10 md:text-3xl">
                County context can reveal a population-level association, but it cannot establish that poverty causes a woman’s death from heart disease.
              </blockquote>
              <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-6 text-sm leading-6 text-slate-300">
                <Info className="mt-0.5 shrink-0 text-teal-200" size={18} />
                This distinction between population-level association and individual-level causation guides interpretation throughout the dashboard.
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="border-l-2 border-teal bg-white p-6">
                <h3 className="font-serif text-xl font-semibold text-navy">Public health relevance</h3>
                <p className="mt-2 leading-7 text-slate-600">Geographic clustering may help prioritize deeper investigation and context-specific prevention resources.</p>
              </div>
              <div className="border-l-2 border-amber bg-white p-6">
                <h3 className="font-serif text-xl font-semibold text-navy">Research contribution</h3>
                <p className="mt-2 leading-7 text-slate-600">The analysis aligns age- and sex-specific poverty estimates with female mortality rates for a consistent county comparison.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="data-sources" className="section-shell">
          <SectionHeading number="03" eyebrow="Data Sources and Variables" title="Two public datasets, joined at the county level.">
            The analysis uses the provided ACS table and CDC mortality extract as its primary quantitative sources. Each contributes one principal variable to a 58-row analytic file.
          </SectionHeading>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="data-card">
              <div className="data-icon"><Database size={22} /></div>
              <p className="eyebrow">Socioeconomic measure</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-navy">Women 35+ poverty rate</h3>
              <p className="mt-4 leading-7 text-slate-600">U.S. Census Bureau, 2020–2024 American Community Survey 5-Year Estimates, table B17001: Poverty Status in the Past 12 Months by Sex by Age.</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm">
                <div><dt className="text-slate-500">Numerator</dt><dd className="mt-1 font-semibold text-navy">Women 35+ below poverty</dd></div>
                <div><dt className="text-slate-500">Denominator</dt><dd className="mt-1 font-semibold text-navy">All women 35+ with status determined</dd></div>
              </dl>
            </article>
            <article className="data-card">
              <div className="data-icon"><HeartPulse size={22} /></div>
              <p className="eyebrow">Health outcome</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-navy">Female heart disease mortality rate</h3>
              <p className="mt-4 leading-7 text-slate-600">CDC/NVSS Heart Disease Mortality Data Among U.S. Adults (35+) by State, Territory, and County, 2022–2024.</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm">
                <div><dt className="text-slate-500">Measure</dt><dd className="mt-1 font-semibold text-navy">Age-adjusted, spatially smoothed 3-year average</dd></div>
                <div><dt className="text-slate-500">Unit</dt><dd className="mt-1 font-semibold text-navy">Deaths per 100,000</dd></div>
              </dl>
            </article>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-navy text-white"><tr><th>Variable</th><th>Source</th><th>Population</th><th>Period</th><th>Role</th></tr></thead>
              <tbody>
                <tr><td>Poverty rate</td><td>ACS B17001</td><td>Women 35+</td><td>2020–2024</td><td>Explanatory variable</td></tr>
                <tr><td>Heart disease mortality</td><td>CDC / NVSS</td><td>Women 35+</td><td>2022–2024</td><td>Outcome variable</td></tr>
              </tbody>
            </table>
          </div>
          <a
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal hover:underline"
            href={`${import.meta.env.BASE_URL}data/california_county_poverty_heart_mortality.csv`}
            download
          >
            Download the validated county-level CSV <ExternalLink size={15} />
          </a>
        </section>

        <section id="methodology" className="section-shell bg-mist">
          <SectionHeading number="04" eyebrow="Methodology" title="A transparent county-level analytic workflow.">
            The study constructs one matched record for each California county, visualizes both measures, and estimates their unweighted linear association.
          </SectionHeading>
          <div className="relative grid gap-5 lg:grid-cols-3">
            {[
              ['01', 'Construct the poverty measure', 'Sum ACS female age groups 35–44, 45–54, 55–64, 65–74, and 75+ below poverty. Divide by the same age groups below plus at or above poverty; multiply by 100.'],
              ['02', 'Filter and join mortality', 'Retain California county records with Sex = Female and Race/Ethnicity = Overall. Join to ACS county names and verify 58 complete matches.'],
              ['03', 'Estimate the association', 'Calculate Pearson’s r and an ordinary least squares line with poverty percentage as x and mortality per 100,000 as y. Counties receive equal analytic weight.'],
            ].map(([step, title, text]) => (
              <article key={step} className="method-card">
                <span className="font-serif text-5xl text-teal/25">{step}</span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-teal/25 bg-teal/5 px-6 py-5 text-sm leading-6 text-slate-700">
            <strong className="text-navy">Reproducibility note:</strong> the validated county-level CSV is regenerated from the two raw source files during every production build, and the application data artifact is derived from that merged table. No county estimates are manually entered.
          </div>
        </section>

        <section id="map" className="section-shell">
          <SectionHeading number="05" eyebrow="Interactive Geographic Map" title="Explore how both measures vary across California.">
            Switch the mapped variable, hover for exact values, and select any county. The same county selection carries into the statistical chart below.
          </SectionHeading>
          <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-full bg-slate-100 p-1" role="group" aria-label="Map variable">
                  <button className={`toggle-button ${mapVariable === 'povertyRate' ? 'toggle-active' : ''}`} onClick={() => setMapVariable('povertyRate')}>Poverty rate</button>
                  <button className={`toggle-button ${mapVariable === 'mortalityRate' ? 'toggle-active' : ''}`} onClick={() => setMapVariable('mortalityRate')}>Mortality rate</button>
                </div>
                <p className="text-xs text-slate-500">Quintile classification · click a county to select</p>
              </div>
              <CountyMap counties={counties} variable={mapVariable} selected={selected} onSelect={handleSelect} />
            </div>
            <aside className="rounded-3xl bg-navy p-7 text-white xl:sticky xl:top-24 xl:self-start">
              <p className="eyebrow !text-teal-200">Selected county</p>
              <h3 className="mt-2 font-serif text-3xl">{selected.county}</h3>
              <div className="mt-7 space-y-6">
                <div><p className="text-3xl font-semibold">{selected.povertyRate.toFixed(1)}%</p><p className="mt-1 text-sm text-slate-300">Women 35+ below poverty</p></div>
                <div className="h-px bg-white/15" />
                <div><p className="text-3xl font-semibold">{selected.mortalityRate.toFixed(1)}</p><p className="mt-1 text-sm text-slate-300">Deaths per 100,000 women 35+</p></div>
                <div className="h-px bg-white/15" />
                <div><p className="text-lg font-semibold">{formatNumber.format(selected.belowPoverty)}</p><p className="mt-1 text-sm text-slate-300">Estimated women 35+ below poverty</p></div>
              </div>
            </aside>
          </div>
        </section>

        <section id="analysis" className="section-shell bg-mist">
          <SectionHeading number="06" eyebrow="Statistical Analysis" title="A moderate positive county-level association.">
            Each point is one county. The orange line is the fitted ordinary least squares relationship. Select a point or use the county finder to inspect its paired values.
          </SectionHeading>
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="metric-card"><p className="metric-label">Pearson’s r</p><p className="metric-value">{stats.r.toFixed(3)}</p><p className="metric-detail">Positive direction</p></div>
            <div className="metric-card"><p className="metric-label">R²</p><p className="metric-value">{stats.rSquared.toFixed(3)}</p><p className="metric-detail">{(stats.rSquared * 100).toFixed(1)}% of county variation</p></div>
            <div className="metric-card"><p className="metric-label">Slope</p><p className="metric-value">{stats.slope.toFixed(2)}</p><p className="metric-detail">Deaths per 100,000 per +1 percentage point</p></div>
            <div className="metric-card"><p className="metric-label">Two-sided test</p><p className="metric-value">p &lt; .001</p><p className="metric-detail">n = {stats.n} counties</p></div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 px-3 pt-2">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-navy">Poverty and heart disease mortality</h3>
                <p className="mt-1 text-sm text-slate-500">Unweighted ecological regression · California counties</p>
              </div>
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select value={selected.fips} onChange={(event) => handleSelect(counties.find((county) => county.fips === event.target.value) ?? selected)} className="county-select">
                  {counties.map((county) => <option key={county.fips} value={county.fips}>{county.county} County</option>)}
                </select>
              </label>
            </div>
            <ScatterAnalysis counties={counties} selected={selected} onSelect={handleSelect} />
            <div className="mx-3 mb-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-teal" />County estimate</span>
              <span><i className="mr-2 inline-block h-0.5 w-5 bg-amber align-middle" />OLS fitted line</span>
              <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber ring-1 ring-navy" />Selected: {selected.county}</span>
            </div>
          </div>
        </section>

        <section id="results" className="section-shell">
          <SectionHeading number="07" eyebrow="Results and Conclusions" title="Higher county poverty rates are associated with higher female heart disease mortality rates.">
            Across all 58 counties, Pearson’s r is {stats.r.toFixed(3)} (p &lt; .001). The fitted model estimates {stats.slope.toFixed(2)} additional deaths per 100,000 for each one-percentage-point increase in the poverty rate among women 35+. Poverty rate alone accounts for {(stats.rSquared * 100).toFixed(1)}% of observed county variation in mortality.
          </SectionHeading>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-teal/25 bg-teal/5 p-8 md:p-10">
              <Scale className="text-teal" size={28} />
              <h3 className="mt-6 font-serif text-2xl font-semibold text-navy">Interpretation</h3>
              <p className="mt-4 text-lg leading-8 text-slate-700">The result supports a meaningful population-level relationship, but substantial variation remains. The estimate is descriptive and ecological; it does not demonstrate a causal effect of poverty on mortality.</p>
              <p className="mt-5 text-sm leading-6 text-slate-500">Model: mortality rate = {stats.intercept.toFixed(2)} + {stats.slope.toFixed(2)} × poverty rate.</p>
            </div>
            <div className="rounded-3xl bg-navy p-8 text-white md:p-10">
              <p className="eyebrow !text-teal-200">Observed ranges</p>
              <div className="mt-6 space-y-6">
                <div><p className="text-3xl font-semibold">{stats.povertyMin.toFixed(1)}–{stats.povertyMax.toFixed(1)}%</p><p className="mt-1 text-sm text-slate-300">County poverty rate</p></div>
                <div className="h-px bg-white/15" />
                <div><p className="text-3xl font-semibold">{stats.mortalityMin.toFixed(1)}–{stats.mortalityMax.toFixed(1)}</p><p className="mt-1 text-sm text-slate-300">County mortality rate per 100,000</p></div>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Ranking title="Highest observed poverty rates" rows={highPoverty} value={(county) => `${county.povertyRate.toFixed(1)}%`} />
            <Ranking title="Highest observed mortality rates" rows={highMortality} value={(county) => `${county.mortalityRate.toFixed(1)} per 100,000`} />
          </div>
        </section>

        <section id="limitations" className="section-shell bg-mist">
          <SectionHeading number="08" eyebrow="Limitations" title="The association must be interpreted within the study design.">
            Measurement, scale, and model choices constrain what can be concluded from this county-level cross-sectional analysis.
          </SectionHeading>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ['Ecological inference', 'County-level correlation cannot establish that individual women in poverty have higher mortality risk. Applying a group pattern to individuals would be an ecological fallacy.'],
              ['Causality and confounding', 'The bivariate model does not establish causation and does not adjust for age structure beyond mortality age-adjustment, race and ethnicity, rurality, health care access, smoking, or other factors.'],
              ['Statistical uncertainty', 'ACS estimates have sampling error, especially in small counties. Spatially smoothed mortality rates also carry uncertainty that is not modeled here.'],
              ['Time and measurement', 'ACS 2020–2024 estimates and CDC 2022–2024 mortality rates overlap but are not identical periods. Poverty is measured using the federal threshold and may not capture California cost-of-living differences.'],
            ].map(([title, text], index) => (
              <article key={title} className="limitation-card">
                <div className="flex items-start justify-between gap-4"><ShieldAlert className="text-amber" size={22} /><span className="text-xs font-bold text-slate-300">0{index + 1}</span></div>
                <h3 className="mt-6 font-serif text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="discussion" className="section-shell">
          <SectionHeading number="09" eyebrow="Discussion and Future Research" title="The pattern is a starting point for explanation, not an endpoint.">
            Future work can test whether the relationship persists after accounting for demographic composition, health care access, behavioral risk, and rurality, while also examining variation within counties.
          </SectionHeading>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ['Build a multivariable model', 'Add county covariates such as age composition, insurance coverage, primary care access, smoking prevalence, and racial or ethnic composition.'],
              ['Model uncertainty and space', 'Use ACS margins of error, mortality uncertainty, population weighting, and spatial regression or hierarchical methods.'],
              ['Examine smaller geographies and time', 'Where data quality permits, analyze census tracts or longitudinal change to identify within-county inequities and temporal ordering.'],
            ].map(([title, text], index) => (
              <article key={title} className="future-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">Next inquiry {index + 1}</p>
                <h3 className="mt-4 font-serif text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
                <ArrowDown className="mt-8 text-teal/40" size={20} />
              </article>
            ))}
          </div>
        </section>

        <section id="references" className="section-shell bg-navy text-white">
          <SectionHeading number="10" eyebrow="References" title="Primary sources and methodological documentation.">
            <span className="text-slate-300">The calculations and visualizations in this dashboard are based on the supplied research files.</span>
          </SectionHeading>
          <div className="divide-y divide-white/10 border-y border-white/10">
            <Reference number="01" title="U.S. Census Bureau. (2024). American Community Survey 2020–2024 5-Year Estimates, Table B17001: Poverty Status in the Past 12 Months by Sex by Age." href="https://data.census.gov/table/ACSDT5Y2024.B17001" />
            <Reference number="02" title="Centers for Disease Control and Prevention. Heart Disease Mortality Data Among U.S. Adults (35+) by State, Territory, and County, 2022–2024." href="https://data.cdc.gov/Heart-Disease-Stroke-Prevention/Heart-Disease-Mortality-Data-Among-US-Adults-35-/i2vk-mgdh" />
            <Reference number="03" title="Data and Methodology. Supplied research document describing the question, study area, variables, and methodological cautions." />
            <Reference number="04" title="U.S. Census Bureau. TIGER/Line county boundaries, used for geographic visualization." href="https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html" />
          </div>
          <div className="mt-10 flex flex-col justify-between gap-5 text-xs text-slate-400 sm:flex-row">
            <p>Academic research dashboard · California counties · Women ages 35+</p>
            <a href="#introduction" className="font-semibold uppercase tracking-[0.16em] text-teal-200">Return to top ↑</a>
          </div>
        </section>
      </main>
    </div>
  )
}

function Ranking({ title, rows, value }: { title: string; rows: CountyData[]; value: (county: CountyData) => string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6">
      <h3 className="font-serif text-xl font-semibold text-navy">{title}</h3>
      <ol className="mt-5 space-y-3">
        {rows.map((county, index) => (
          <li key={county.fips} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0">
            <span><b className="mr-3 text-teal">{index + 1}</b>{county.county}</span><span className="font-semibold text-navy">{value(county)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Reference({ number, title, href }: { number: string; title: string; href?: string }) {
  const content = <><span className="shrink-0 font-bold text-teal-200">{number}</span><span className="max-w-4xl leading-7 text-slate-200">{title}</span>{href && <ExternalLink className="ml-auto shrink-0 text-slate-500" size={16} />}</>
  return href ? <a className="flex gap-5 py-6 transition-colors hover:text-teal-200" href={href} target="_blank" rel="noreferrer">{content}</a> : <div className="flex gap-5 py-6">{content}</div>
}

export default App
