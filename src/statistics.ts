import type { CountyData } from './types'

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

export type DescriptiveSummary = {
  mean: number
  median: number
  min: number
  max: number
  standardDeviation: number
  range: number
}

export type HistogramBin = {
  label: string
  lower: number
  upper: number
  midpoint: number
  count: number
}

export function descriptive(values: number[]): DescriptiveSummary {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const average = mean(sorted)
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const variance = sorted.reduce((sum, value) => sum + (value - average) ** 2, 0) / sorted.length

  return {
    mean: average,
    median,
    min,
    max,
    standardDeviation: Math.sqrt(variance),
    range: max - min,
  }
}

// Lanczos log-gamma and a continued fraction implementation of the regularized
// incomplete beta function support a calculated two-sided correlation p-value.
function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ]
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value)
  let adjusted = value - 1
  let series = 0.9999999999998099
  coefficients.forEach((coefficient, index) => { series += coefficient / (adjusted + index + 1) })
  const t = adjusted + coefficients.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(t) - t + Math.log(series)
}

function betaFraction(a: number, b: number, x: number) {
  const maxIterations = 200
  const epsilon = 3e-12
  const floor = 1e-30
  let c = 1
  let d = 1 - ((a + b) * x) / (a + 1)
  if (Math.abs(d) < floor) d = floor
  d = 1 / d
  let result = d

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const even = 2 * iteration
    let numerator = (iteration * (b - iteration) * x) / ((a + even - 1) * (a + even))
    d = 1 + numerator * d
    if (Math.abs(d) < floor) d = floor
    c = 1 + numerator / c
    if (Math.abs(c) < floor) c = floor
    d = 1 / d
    result *= d * c

    numerator = -((a + iteration) * (a + b + iteration) * x) / ((a + even) * (a + even + 1))
    d = 1 + numerator * d
    if (Math.abs(d) < floor) d = floor
    c = 1 + numerator / c
    if (Math.abs(c) < floor) c = floor
    d = 1 / d
    const delta = d * c
    result *= delta
    if (Math.abs(delta - 1) < epsilon) break
  }
  return result
}

function regularizedBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  return x < (a + 1) / (a + b + 2)
    ? (front * betaFraction(a, b, x)) / a
    : 1 - (front * betaFraction(b, a, 1 - x)) / b
}

export function summarize(counties: CountyData[]) {
  const x = counties.map((county) => county.povertyRate)
  const y = counties.map((county) => county.mortalityRate)
  const xMean = mean(x)
  const yMean = mean(y)
  const covariance = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0)
  const xSquares = x.reduce((sum, value) => sum + (value - xMean) ** 2, 0)
  const ySquares = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0)
  const r = covariance / Math.sqrt(xSquares * ySquares)
  const slope = covariance / xSquares
  const intercept = yMean - slope * xMean
  const degreesOfFreedom = counties.length - 2
  const tStatistic = r * Math.sqrt(degreesOfFreedom / (1 - r ** 2))
  const pValue = regularizedBeta(
    degreesOfFreedom / (degreesOfFreedom + tStatistic ** 2),
    degreesOfFreedom / 2,
    0.5,
  )
  const poverty = descriptive(x)
  const mortality = descriptive(y)

  return {
    n: counties.length,
    r,
    rSquared: r ** 2,
    slope,
    intercept,
    pValue,
    poverty,
    mortality,
    povertyMean: xMean,
    mortalityMean: yMean,
    povertyMin: Math.min(...x),
    povertyMax: Math.max(...x),
    mortalityMin: Math.min(...y),
    mortalityMax: Math.max(...y),
  }
}

export function histogram(values: number[], binCount = 7): HistogramBin[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = (max - min) / binCount

  return Array.from({ length: binCount }, (_, index) => {
    const lower = min + index * width
    const upper = index === binCount - 1 ? max : lower + width
    const count = values.filter((value) => value >= lower && (index === binCount - 1 ? value <= upper : value < upper)).length
    return {
      label: `${lower.toFixed(1)}–${upper.toFixed(1)}`,
      lower,
      upper,
      midpoint: (lower + upper) / 2,
      count,
    }
  })
}

export function formatPValue(pValue: number) {
  if (pValue < 0.001) return 'p < .001'
  return `p = ${pValue.toFixed(3).replace(/^0/, '')}`
}

export function quantiles(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const at = (p: number) => {
    const index = (sorted.length - 1) * p
    const lower = Math.floor(index)
    const fraction = index - lower
    return sorted[lower + 1] === undefined
      ? sorted[lower]
      : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower])
  }
  return [at(0.2), at(0.4), at(0.6), at(0.8)]
}
