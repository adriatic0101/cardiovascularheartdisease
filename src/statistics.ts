import type { CountyData } from './types'

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

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

  return {
    n: counties.length,
    r,
    rSquared: r ** 2,
    slope,
    intercept,
    povertyMean: xMean,
    mortalityMean: yMean,
    povertyMin: Math.min(...x),
    povertyMax: Math.max(...x),
    mortalityMin: Math.min(...y),
    mortalityMax: Math.max(...y),
  }
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
