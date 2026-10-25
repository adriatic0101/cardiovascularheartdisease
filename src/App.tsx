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
import { CountyMap } from './components/InteractiveCountyMap'
import { StatisticalAnalysis } from './components/StatisticalAnalysis'
import { formatPValue, summarize } from './statistics'
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
  const [mapMode, setMapMode] = useState<'single' | 'compare'>('single')
  const [countyQuery, setCountyQuery] = useState(`${initialCounty.county} County`)
  const [mapFocusRequest, setMapFocusRequest] = useState(0)
  const handleSelect = useCallback((county: CountyData) => setSelected(county), [])

  const povertyRanks = useMemo(() => new Map(
    [...counties]
      .sort((a, b) => b.povertyRate - a.povertyRate)
      .map((county, index) => [county.fips, index + 1]),
  ), [])
  const mortalityRanks = useMemo(() => new Map(
    [...counties]
      .sort((a, b) => b.mortalityRate - a.mortalityRate)
      .map((county, index) => [county.fips, index + 1]),
  ), [])

  const handleCountySearch = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = countyQuery.trim().toLowerCase().replace(/\s+county$/, '')
    const county = counties.find((candidate) => candidate.county.toLowerCase() === normalized)
    if (!county) return
    handleSelect(county)
    setCountyQuery(`${county.county} County`)
    setMapFocusRequest((request) => request + 1)
  }

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
          <SectionHeading number="01" eyebrow="Introduction" title="Examining the socioeconomic geography of women’s cardiovascular mortality.">
            Heart disease remains an important cause of mortality among adults, yet its burden is not distributed uniformly across places or populations. This study evaluates whether county-level poverty among women ages 35 and older is associated with female heart disease mortality across all 58 California counties.
          </SectionHeading>
          <div className="mb-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 text-[1.05rem] leading-8 text-slate-600">
              <div>
                <h3 className="subsection-title">Study focus</h3>
                <p className="mt-3">The analysis aligns two population measures at a common geographic scale: the percentage of women ages 35+ living below the federal poverty threshold and the age-adjusted heart disease mortality rate among women ages 35+. Restricting both measures to the same sex and broad age range strengthens their conceptual comparability.</p>
              </div>
              <div>
                <h3 className="subsection-title">Why this question matters</h3>
                <p className="mt-3">Geographic and socioeconomic disparities warrant investigation because the conditions that support cardiovascular health—including access to healthcare, preventive services, stable housing, nutritious food, and economic security—vary across communities. Identifying counties where disadvantage and mortality coincide can guide more focused research and public health assessment.</p>
              </div>
            </div>
            <aside className="rounded-3xl bg-navy p-8 text-white md:p-10">
              <p className="eyebrow !text-teal-200">Research question</p>
              <p className="mt-5 font-serif text-2xl leading-10">To what extent are poverty rates among women ages 35+ associated with heart disease mortality rates among women ages 35+ across California’s 58 counties?</p>
              <p className="mt-7 border-t border-white/15 pt-6 text-sm leading-6 text-slate-300">This is an ecological study: counties are the units of observation, and conclusions concern relationships between county characteristics rather than individual-level risk.</p>
            </aside>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
            {[
              [UsersRound, 'Population', 'Women ages 35 and older', 'The study centers women in the age range represented by the mortality dataset and aggregates the corresponding ACS age categories.'],
              [MapPinned, 'Study area', 'California’s 58 counties', 'Complete county coverage permits statewide comparison while preserving meaningful local geographic variation.'],
              [TrendingUp, 'Project overview', 'Map, describe, and model', 'Interactive maps and descriptive summaries precede Pearson correlation and simple linear regression.'],
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
          <SectionHeading number="02" eyebrow="Background and Research Significance" title="Mortality, material conditions, and place represent distinct but connected dimensions of cardiovascular health.">
            The study is motivated by a place-based hypothesis: California counties with higher poverty rates among women ages 35+ may also experience higher female heart disease mortality rates. The proposed relationship is plausible, but the analysis is designed to assess association rather than causation.
          </SectionHeading>
          <div className="grid gap-5 lg:grid-cols-3">
            <article className="background-card">
              <p className="eyebrow">Outcome definition</p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-navy">Mortality is not prevalence</h3>
              <p className="mt-4 leading-7 text-slate-600">Heart disease mortality measures deaths attributed to heart disease in a defined population and period. It differs from prevalence, which measures the proportion of people living with heart disease at a given time. A county may therefore have substantial disease prevalence without an equivalent mortality rate, or elevated mortality shaped by disease severity, treatment access, survival, and population composition.</p>
            </article>
            <article className="background-card">
              <p className="eyebrow">Plausible pathways</p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-navy">Poverty may affect cardiovascular conditions</h3>
              <p className="mt-4 leading-7 text-slate-600">Economic hardship may constrain insurance coverage, transportation, medication affordability, continuity of care, and access to screening or preventive treatment. It may also increase chronic stress and exposure to housing, food, and neighborhood conditions that are relevant to cardiovascular risk. These mechanisms can overlap and accumulate over time; they are not directly measured in the present bivariate analysis.</p>
            </article>
            <article className="background-card">
              <p className="eyebrow">Geographic scale</p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-navy">Counties offer a policy-relevant comparison</h3>
              <p className="mt-4 leading-7 text-slate-600">California counties encompass substantial variation in population size, rurality, economic conditions, healthcare infrastructure, and service administration. They are large enough to support comparable public estimates while remaining meaningful units for public health planning. County averages nevertheless conceal within-county differences and should not be interpreted as individual experiences.</p>
            </article>
          </div>
          <div className="mt-7 grid gap-7 rounded-3xl bg-navy p-8 text-white md:grid-cols-[0.75fr_1.25fr] md:p-10">
            <div>
              <p className="eyebrow !text-teal-200">Study hypothesis</p>
              <p className="mt-4 font-serif text-2xl leading-9">Counties with higher female poverty rates will tend to have higher female heart disease mortality rates.</p>
            </div>
            <div className="flex items-start gap-3 border-t border-white/15 pt-6 text-sm leading-7 text-slate-300 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <Info className="mt-1 shrink-0 text-teal-200" size={18} />
              <p>The hypothesis concerns the expected direction of a county-level association. A positive correlation would be consistent with the hypothesis, but would not demonstrate that poverty caused any individual death or exclude alternative explanations.</p>
            </div>
          </div>
        </section>

        <section id="data-sources" className="section-shell">
          <SectionHeading number="03" eyebrow="Data Sources and Variables" title="Two public data systems provide complementary measures of socioeconomic conditions and mortality.">
            The analytic dataset combines the U.S. Census Bureau’s American Community Survey with CDC/NVSS heart disease mortality estimates. County names and five-digit FIPS codes provide the common geographic identifiers, producing one validated record for each California county.
          </SectionHeading>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="data-card">
              <div className="data-icon"><Database size={22} /></div>
              <p className="eyebrow">Socioeconomic measure</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-navy">Women 35+ poverty rate</h3>
              <p className="mt-4 leading-7 text-slate-600">The independent variable is derived from the U.S. Census Bureau’s 2020–2024 American Community Survey 5-Year Estimates, table B17001: Poverty Status in the Past 12 Months by Sex by Age.</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm">
                <div><dt className="text-slate-500">Numerator</dt><dd className="mt-1 font-semibold text-navy">Women 35+ below poverty</dd></div>
                <div><dt className="text-slate-500">Denominator</dt><dd className="mt-1 font-semibold text-navy">All women 35+ with status determined</dd></div>
              </dl>
            </article>
            <article className="data-card">
              <div className="data-icon"><HeartPulse size={22} /></div>
              <p className="eyebrow">Health outcome</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-navy">Female heart disease mortality rate</h3>
              <p className="mt-4 leading-7 text-slate-600">The dependent variable comes from the CDC/NVSS Heart Disease Mortality Data Among U.S. Adults (35+) by State, Territory, and County for 2022–2024.</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm">
                <div><dt className="text-slate-500">Measure</dt><dd className="mt-1 font-semibold text-navy">Age-adjusted, spatially smoothed 3-year average</dd></div>
                <div><dt className="text-slate-500">Unit</dt><dd className="mt-1 font-semibold text-navy">Deaths per 100,000</dd></div>
              </dl>
            </article>
          </div>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <caption className="bg-slate-50 px-5 py-4 text-left font-serif text-lg font-semibold text-navy">Operational definitions of the principal study variables</caption>
              <thead className="bg-navy text-white"><tr><th>Variable</th><th>Source</th><th>Population</th><th>Geographic coverage</th><th>Reference period</th><th>Unit</th></tr></thead>
              <tbody>
                <tr><td>Female poverty rate, ages 35+ <span className="block text-xs font-normal text-slate-400">Independent variable</span></td><td>U.S. Census Bureau, ACS 5-Year Table B17001</td><td>Women ages 35 and older with poverty status determined</td><td>All 58 California counties</td><td>2020–2024</td><td>Percent below the federal poverty threshold</td></tr>
                <tr><td>Female heart disease mortality rate, ages 35+ <span className="block text-xs font-normal text-slate-400">Dependent variable</span></td><td>CDC / National Vital Statistics System</td><td>Women ages 35 and older; overall race/ethnicity category</td><td>All 58 California counties</td><td>2022–2024</td><td>Age-adjusted, spatially smoothed 3-year average deaths per 100,000</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-500">The ACS measure is an estimate of poverty status, whereas the CDC outcome is an age-adjusted and spatially smoothed mortality rate. The measures overlap in time but do not have identical reference periods.</p>
          <a
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal hover:underline"
            href={`${import.meta.env.BASE_URL}data/california_county_poverty_heart_mortality.csv`}
            download
          >
            Download the validated county-level CSV <ExternalLink size={15} />
          </a>
        </section>

        <section id="methodology" className="section-shell bg-mist">
          <SectionHeading number="04" eyebrow="Methodology" title="A reproducible ecological workflow links demographic aggregation, geographic validation, and statistical analysis.">
            The incomplete methods outline in the supplied research document is operationalized here using the project’s implemented processing pipeline. The county is the unit of analysis, and each county contributes one paired poverty and mortality observation.
          </SectionHeading>
          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="subsection-title">Data preparation and variable construction</h3>
              <p className="mt-3 leading-8 text-slate-600">The processing script first verifies the ACS section headings and female demographic row labels before extracting estimates. For both the below-poverty and at-or-above-poverty categories, it sums women ages 35–44, 45–54, 55–64, 65–74, and 75 years and older. The denominator includes all women in these age groups whose poverty status was determined.</p>
              <div className="formula-box mt-5">
                <span>Female poverty rate (%)</span>
                <strong>100 × Women 35+ below poverty ÷ Women 35+ with poverty status determined</strong>
              </div>
            </div>
            <div>
              <h3 className="subsection-title">Mortality selection and geographic merge</h3>
              <p className="mt-3 leading-8 text-slate-600">CDC records are restricted to California, county geography, female sex, overall race/ethnicity, and the Heart Disease Mortality topic. The retained outcome is the age-adjusted, spatially smoothed 3-year average rate per 100,000 adults ages 35+. Records are merged to ACS estimates using standardized county names and verified five-digit county FIPS codes.</p>
              <p className="mt-4 leading-8 text-slate-600">Validation requires exactly 58 unique counties, with no duplicate FIPS codes, unmatched counties, or missing required numeric values. Missing values are not fabricated, interpolated, or replaced with zero.</p>
            </div>
          </div>

          <div className="method-workflow" aria-label="Seven-step methodology workflow">
            {[
              ['01', 'Validate source structure', 'Confirm county columns, poverty sections, female labels, and the five required age groups.'],
              ['02', 'Aggregate women 35+', 'Sum below-poverty and at/above-poverty counts across ages 35–44 through 75+.'],
              ['03', 'Calculate poverty rate', 'Divide the below-poverty total by all women 35+ with status determined and multiply by 100.'],
              ['04', 'Filter CDC mortality', 'Retain California county, female, overall race/ethnicity, heart disease mortality records.'],
              ['05', 'Merge and validate', 'Join by standardized county identity; require 58 unique, complete county records.'],
              ['06', 'Map and describe', 'Map county values by quintile and summarize distributions, ranges, and rankings.'],
              ['07', 'Estimate association', 'Compute Pearson correlation and an unweighted ordinary least squares regression.'],
            ].map(([step, title, text]) => (
              <article key={step} className="method-step">
                <span className="method-number">{step}</span>
                <h4 className="mt-5 font-serif text-lg font-semibold text-navy">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="method-detail"><h3>Geographic mapping</h3><p>County polygons are joined by FIPS code and displayed as interactive choropleths. Quintile classifications support relative geographic comparison; exact values remain available through selection and hover interactions.</p></div>
            <div className="method-detail"><h3>Descriptive statistics</h3><p>The dashboard reports the number of counties, observed ranges, means, and ranked county values to characterize both variables before evaluating their relationship.</p></div>
            <div className="method-detail"><h3>Inferential summary</h3><p>Pearson’s r summarizes the direction and strength of the linear association. Simple linear regression estimates the change in mortality rate associated with a one-percentage-point difference in poverty and reports R² as the proportion of county variation explained by the bivariate model.</p></div>
          </div>
          <div className="mt-6 rounded-xl border border-teal/25 bg-teal/5 px-6 py-5 text-sm leading-6 text-slate-700">
            <strong className="text-navy">Reproducibility note:</strong> the validated county-level CSV is regenerated from the two raw source files during every production build, and the application data artifact is derived from that merged table. Statistical estimates are calculated from these 58 unweighted county observations; no county values are manually entered.
          </div>
        </section>

        <section id="map" className="section-shell">
          <SectionHeading number="05" eyebrow="Interactive Geographic Map" title="Explore county patterns in poverty and heart disease mortality.">
            Switch between data-derived choropleth layers or compare both maps side by side. Hover for paired values, click a polygon for county details, or search by county name. The selected county is highlighted in the statistical chart below.
          </SectionHeading>
          <div className="map-toolbar mb-5">
            <form className="map-search" onSubmit={handleCountySearch}>
              <label htmlFor="county-map-search">Find a county</label>
              <div className="relative flex min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="county-map-search"
                  list="california-counties"
                  value={countyQuery}
                  onChange={(event) => setCountyQuery(event.target.value)}
                  placeholder="Search county name"
                  className="map-search-input"
                />
                <datalist id="california-counties">
                  {counties.map((county) => <option key={county.fips} value={`${county.county} County`} />)}
                </datalist>
                <button type="submit" className="map-search-button">Locate</button>
              </div>
            </form>
            <div className="map-view-controls">
              <span>View</span>
              <div className="inline-flex rounded-full bg-slate-100 p-1" role="group" aria-label="Map layout">
                <button className={`toggle-button ${mapMode === 'single' ? 'toggle-active' : ''}`} onClick={() => setMapMode('single')}>Single</button>
                <button className={`toggle-button ${mapMode === 'compare' ? 'toggle-active' : ''}`} onClick={() => setMapMode('compare')}>Compare both</button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-5">
              {mapMode === 'single' ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex rounded-full bg-slate-100 p-1" role="group" aria-label="Map variable">
                      <button className={`toggle-button ${mapVariable === 'povertyRate' ? 'toggle-active' : ''}`} onClick={() => setMapVariable('povertyRate')}>Female poverty rate</button>
                      <button className={`toggle-button ${mapVariable === 'mortalityRate' ? 'toggle-active' : ''}`} onClick={() => setMapVariable('mortalityRate')}>Female mortality rate</button>
                    </div>
                    <p className="text-xs text-slate-500">Hover to compare values · click to select</p>
                  </div>
                  <CountyMap counties={counties} variable={mapVariable} selected={selected} onSelect={handleSelect} focusRequest={mapFocusRequest} />
                </>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 font-serif text-xl font-semibold text-navy">Female poverty rate (%)</h3>
                    <CountyMap counties={counties} variable="povertyRate" selected={selected} onSelect={handleSelect} focusRequest={mapFocusRequest} compact />
                  </div>
                  <div>
                    <h3 className="mb-3 font-serif text-xl font-semibold text-navy">Female mortality rate (per 100,000)</h3>
                    <CountyMap counties={counties} variable="mortalityRate" selected={selected} onSelect={handleSelect} focusRequest={mapFocusRequest} compact />
                  </div>
                </div>
              )}
            </div>
            <aside className="rounded-3xl bg-navy p-7 text-white xl:sticky xl:top-24 xl:self-start" aria-live="polite">
              <p className="eyebrow !text-teal-200">County information</p>
              <h3 className="mt-2 font-serif text-3xl">{selected.county} County</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400">FIPS {selected.fips}</p>
              <div className="mt-7 space-y-5">
                <div><p className="text-3xl font-semibold">{selected.povertyRate.toFixed(1)}%</p><p className="mt-1 text-sm text-slate-300">Female poverty rate, ages 35+</p></div>
                <div><p className="text-3xl font-semibold">{selected.mortalityRate.toFixed(1)}</p><p className="mt-1 text-sm text-slate-300">Female heart disease deaths per 100,000</p></div>
                <div className="grid grid-cols-2 gap-4 border-y border-white/15 py-5">
                  <div><p className="text-lg font-semibold">{formatNumber.format(selected.belowPoverty)}</p><p className="mt-1 text-xs leading-5 text-slate-300">Women 35+ below poverty</p></div>
                  <div><p className="text-lg font-semibold">{formatNumber.format(selected.women35Plus)}</p><p className="mt-1 text-xs leading-5 text-slate-300">Women 35+ with status determined</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rank-card"><p>#{povertyRanks.get(selected.fips)}</p><span>Poverty rank</span></div>
                  <div className="rank-card"><p>#{mortalityRanks.get(selected.fips)}</p><span>Mortality rank</span></div>
                </div>
                <p className="text-xs leading-5 text-slate-400">Rank 1 indicates the highest observed county rate among 58 counties.</p>
              </div>
            </aside>
          </div>
        </section>

        <section id="analysis" className="section-shell bg-mist">
          <SectionHeading number="06" eyebrow="Statistical Analysis" title="A moderate positive county-level association.">
            Explore the bivariate relationship, county distributions, rankings, and side-by-side comparisons. Every result below is calculated from the processed 58-county dataset; selecting a county here updates the map and every linked view.
          </SectionHeading>
          <StatisticalAnalysis counties={counties} selected={selected} onSelect={handleSelect} />
        </section>

        <section id="results" className="section-shell">
          <SectionHeading number="07" eyebrow="Results and Conclusions" title="Higher county poverty rates are associated with higher female heart disease mortality rates.">
            Across all 58 counties, Pearson’s r is {stats.r.toFixed(3)} ({formatPValue(stats.pValue)}). The fitted model estimates {stats.slope.toFixed(2)} additional deaths per 100,000 for each one-percentage-point increase in the poverty rate among women 35+. Poverty rate alone accounts for {(stats.rSquared * 100).toFixed(1)}% of observed county variation in mortality.
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
