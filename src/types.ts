export type CountyData = {
  county: string
  fips: string
  povertyRate: number
  belowPoverty: number
  women35Plus: number
  mortalityRate: number
}

export type MapVariable = 'povertyRate' | 'mortalityRate'
