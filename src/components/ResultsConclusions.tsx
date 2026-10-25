import { CheckCircle2, ShieldAlert } from 'lucide-react'
import type { CountyData } from '../types'
import { formatPValue, summarize } from '../statistics'

type Props = { counties: CountyData[] }

type ExtremeRow = {
  indicator: string
  highest: CountyData[]
  lowest: CountyData[]
  value: (county: CountyData) => string
}

function FindingSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="finding-section" aria-labelledby={`finding-${number}`}>
      <div className="finding-number">{number}</div>
      <div>
        <h3 id={`finding-${number}`}>{title}</h3>
        <div className="finding-copy">{children}</div>
      </div>
    </section>
  )
}

function SummaryStrip({ values }: { values: Array<{ label: string; value: string; detail: string }> }) {
  return (
    <dl className="results-summary-strip">
      {values.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          <p>{item.detail}</p>
        </div>
      ))}
    </dl>
  )
}

function ExtremesTable({ rows }: { rows: ExtremeRow[] }) {
  return (
    <div className="academic-table-wrap">
      <table className="academic-results-table">
        <caption>Table 2. Counties at the upper and lower ends of each observed distribution</caption>
        <thead><tr><th>Indicator</th><th>Five highest counties</th><th>Five lowest counties</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.indicator}>
              <th>{row.indicator}</th>
              <td><ol>{row.highest.map((county) => <li key={county.fips}><span>{county.county}</span><strong>{row.value(county)}</strong></li>)}</ol></td>
              <td><ol>{row.lowest.map((county) => <li key={county.fips}><span>{county.county}</span><strong>{row.value(county)}</strong></li>)}</ol></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-note">Note. Rankings use the observed county estimates without population weighting. “Highest” and “lowest” are descriptive and do not imply statistical separation between counties.</p>
    </div>
  )
}

export function ResultsConclusions({ counties }: Props) {
  const stats = summarize(counties)
  const povertyHigh = [...counties].sort((a, b) => b.povertyRate - a.povertyRate).slice(0, 5)
  const povertyLow = [...counties].sort((a, b) => a.povertyRate - b.povertyRate).slice(0, 5)
  const mortalityHigh = [...counties].sort((a, b) => b.mortalityRate - a.mortalityRate).slice(0, 5)
  const mortalityLow = [...counties].sort((a, b) => a.mortalityRate - b.mortalityRate).slice(0, 5)
  const povertyMaximum = povertyHigh[0]
  const povertyMinimum = povertyLow[0]
  const mortalityMaximum = mortalityHigh[0]
  const mortalityMinimum = mortalityLow[0]
  const residuals = counties
    .map((county) => {
      const predicted = stats.intercept + stats.slope * county.povertyRate
      return { ...county, predicted, residual: county.mortalityRate - predicted }
    })
    .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual))
    .slice(0, 6)

  return (
    <>
      <div className="results-paper">
        <FindingSection number="7.1" title="Geographic Variation in Female Poverty">
          <p>Female poverty rates among women ages 35+ varied substantially across California’s 58 counties. The unweighted county mean was <strong>{stats.poverty.mean.toFixed(1)}%</strong>, and the median was <strong>{stats.poverty.median.toFixed(1)}%</strong>. The proximity of these two measures indicates that the center of the county distribution was similar whether summarized by the arithmetic mean or the midpoint county.</p>
          <p>The minimum was <strong>{povertyMinimum.povertyRate.toFixed(1)}% in {povertyMinimum.county} County</strong>, while the maximum was <strong>{povertyMaximum.povertyRate.toFixed(1)}% in {povertyMaximum.county} County</strong>. This produced a range of <strong>{stats.poverty.range.toFixed(1)} percentage points</strong>. The mapped pattern therefore reflects meaningful place-to-place variation rather than a uniform statewide county rate.</p>
          <SummaryStrip values={[
            { label: 'Mean', value: `${stats.poverty.mean.toFixed(1)}%`, detail: 'Unweighted county mean' },
            { label: 'Median', value: `${stats.poverty.median.toFixed(1)}%`, detail: 'Middle of 58 counties' },
            { label: 'Minimum', value: `${stats.poverty.min.toFixed(1)}%`, detail: povertyMinimum.county },
            { label: 'Maximum', value: `${stats.poverty.max.toFixed(1)}%`, detail: povertyMaximum.county },
            { label: 'Range', value: `${stats.poverty.range.toFixed(1)} pp`, detail: 'Maximum minus minimum' },
          ]} />
        </FindingSection>

        <FindingSection number="7.2" title="Geographic Variation in Female Heart Disease Mortality">
          <p>Age-adjusted heart disease mortality among women ages 35+ also differed widely across counties. The mean county rate was <strong>{stats.mortality.mean.toFixed(1)}</strong> deaths per 100,000 and the median was <strong>{stats.mortality.median.toFixed(1)}</strong> per 100,000.</p>
          <p>The lowest observed rate was <strong>{mortalityMinimum.mortalityRate.toFixed(1)} in {mortalityMinimum.county} County</strong>; the highest was <strong>{mortalityMaximum.mortalityRate.toFixed(1)} in {mortalityMaximum.county} County</strong>. The resulting range was <strong>{stats.mortality.range.toFixed(1)} deaths per 100,000</strong>, and the maximum was {(mortalityMaximum.mortalityRate / mortalityMinimum.mortalityRate).toFixed(1)} times the minimum. These differences establish substantial geographic heterogeneity, but the present bivariate study does not determine why particular counties differ.</p>
          <SummaryStrip values={[
            { label: 'Mean', value: stats.mortality.mean.toFixed(1), detail: 'Deaths per 100,000' },
            { label: 'Median', value: stats.mortality.median.toFixed(1), detail: 'Deaths per 100,000' },
            { label: 'Minimum', value: stats.mortality.min.toFixed(1), detail: mortalityMinimum.county },
            { label: 'Maximum', value: stats.mortality.max.toFixed(1), detail: mortalityMaximum.county },
            { label: 'Range', value: stats.mortality.range.toFixed(1), detail: 'Deaths per 100,000' },
          ]} />
        </FindingSection>

        <ExtremesTable rows={[
          { indicator: 'Female poverty rate, ages 35+', highest: povertyHigh, lowest: povertyLow, value: (county) => `${county.povertyRate.toFixed(1)}%` },
          { indicator: 'Female heart disease mortality, ages 35+', highest: mortalityHigh, lowest: mortalityLow, value: (county) => `${county.mortalityRate.toFixed(1)}` },
        ]} />

        <FindingSection number="7.3" title="Relationship Between Poverty and Heart Disease Mortality">
          <p>Pearson’s correlation was <strong>r = {stats.r.toFixed(3)}</strong> ({formatPValue(stats.pValue)}; n = {stats.n}), indicating a <strong>moderate positive linear association</strong>. Counties with higher female poverty rates tended, on average, to have higher female heart disease mortality rates.</p>
          <p>The coefficient of determination was <strong>R² = {stats.rSquared.toFixed(3)}</strong>. Thus, the simple linear model using poverty alone accounted for <strong>{(stats.rSquared * 100).toFixed(1)}%</strong> of the observed county-level variation in mortality; the remaining {(100 - stats.rSquared * 100).toFixed(1)}% was not accounted for by this one-predictor model. The fitted line was <strong>mortality = {stats.intercept.toFixed(2)} + {stats.slope.toFixed(2)} × poverty</strong>. Its slope estimates {stats.slope.toFixed(2)} additional deaths per 100,000 for each one-percentage-point increase in female poverty.</p>
          <p>Several counties lay noticeably away from the fitted line. The table reports the six largest absolute residuals—the difference between observed and model-predicted mortality. A positive residual means mortality was higher than the bivariate model predicted; a negative residual means it was lower. These deviations are statistical descriptions only and do not establish county-specific explanations.</p>
          <div className="academic-table-wrap compact-table">
            <table className="academic-results-table">
              <caption>Table 3. Largest absolute deviations from the fitted county-level regression line</caption>
              <thead><tr><th>County</th><th>Poverty rate (%)</th><th>Observed mortality</th><th>Predicted mortality</th><th>Residual</th></tr></thead>
              <tbody>{residuals.map((county) => <tr key={county.fips}><th>{county.county}</th><td>{county.povertyRate.toFixed(1)}</td><td>{county.mortalityRate.toFixed(1)}</td><td>{county.predicted.toFixed(1)}</td><td className={county.residual > 0 ? 'positive-residual' : 'negative-residual'}>{county.residual > 0 ? '+' : ''}{county.residual.toFixed(1)}</td></tr>)}</tbody>
            </table>
            <p className="table-note">Note. Mortality values and residuals are deaths per 100,000. Rows are ordered by absolute residual magnitude.</p>
          </div>
        </FindingSection>

        <FindingSection number="7.4" title="Summary of Findings">
          <p>Both study variables showed substantial variation across California counties. The positive correlation and upward regression slope were consistent with the hypothesis that counties with higher poverty rates among women ages 35+ may also have higher female heart disease mortality rates. However, R² shows that poverty alone captured only part of the geographic variation, and the sizeable residuals demonstrate that counties with similar poverty rates can have meaningfully different mortality estimates.</p>
        </FindingSection>
      </div>

      <section className="conclusion-panel" aria-labelledby="conclusion-title">
        <div><p className="eyebrow !text-teal-200">Conclusion</p><h3 id="conclusion-title">The relationship is positive and meaningful at the county level, but incomplete.</h3></div>
        <div className="conclusion-copy">
          <p><strong>Direct answer to the research question:</strong> female poverty rates were moderately associated with female heart disease mortality rates across California counties (r = {stats.r.toFixed(3)}). Poverty explained {(stats.rSquared * 100).toFixed(1)}% of observed county variation in the bivariate model.</p>
          <p>The findings suggest that socioeconomic disparities and cardiovascular mortality are geographically connected at the population level. For public health practice, the pattern supports considering economic conditions when identifying places that may warrant closer assessment, preventive resources, or further study. It does not show that poverty caused mortality differences, identify individual risk, or explain the experience of any particular county.</p>
        </div>
      </section>
    </>
  )
}

const limitations = [
  ['Ecological fallacy and county aggregation', 'The unit of analysis is the county, not the individual. A county-level association cannot establish that individual women living below poverty experienced higher mortality. Counties also contain substantial within-county socioeconomic and health variation that is concealed when each county is represented by one paired observation.'],
  ['Correlation, causation, and confounding', 'Pearson correlation and simple linear regression quantify association; they do not establish temporal ordering or a causal effect. The model does not adjust for potential confounders such as age composition beyond mortality age adjustment, race and ethnicity, rurality, smoking, insurance coverage, health care access, environmental exposure, or other social conditions.'],
  ['Different reference periods', 'The ACS poverty measure summarizes 2020–2024, whereas the mortality measure summarizes 2022–2024. The periods overlap but are not identical. As a result, the paired estimates do not represent precisely the same exposure window, and the cross-sectional design cannot determine whether county poverty preceded mortality.'],
  ['ACS sampling error', 'ACS five-year estimates are survey estimates and therefore have margins of error. This analysis uses county point estimates without incorporating those margins of error, weighting observations by their precision, or propagating poverty-estimate uncertainty into the regression. Precision may differ considerably between populous and sparsely populated counties.'],
  ['Mortality uncertainty and spatial smoothing', 'The mortality rates are modeled, spatially smoothed estimates rather than exact counts. They retain estimation uncertainty, and smoothing can stabilize rates in counties with fewer events while also borrowing information across places. Confidence or credible intervals were not modeled here, so apparent differences between counties should not be treated as statistically distinct without additional uncertainty analysis.'],
  ['Non-equivalent measurement scales', 'The dependent variable is age-adjusted to improve mortality comparisons across counties with different age structures. The poverty rate is a crude proportion among women ages 35+ and is not age-standardized within that broad age range. The measures are aligned by sex and minimum age but are not adjusted in the same way.'],
  ['Possible spatial dependence', 'Nearby counties may share health care markets, economic conditions, environments, and populations, so county observations may not be statistically independent. The Pearson test and ordinary least squares model used here do not assess spatial autocorrelation or correct standard errors for spatial dependence. Spatial regression or hierarchical models would be appropriate extensions.'],
]

export function DetailedLimitations() {
  return (
    <div className="limitations-grid">
      {limitations.map(([title, text], index) => (
        <article key={title} className="limitation-card detailed-limitation">
          <div className="flex items-start justify-between gap-4"><ShieldAlert className="text-amber" size={22} /><span>{String(index + 1).padStart(2, '0')}</span></div>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
      <aside className="limitations-caution">
        <CheckCircle2 size={24} />
        <div><h3>Appropriate interpretation</h3><p>The verified result is a county-level, unweighted, bivariate association. It is evidence of geographic covariation—not an individual-level risk estimate, causal effect, or complete explanation of mortality disparities.</p></div>
      </aside>
    </div>
  )
}
