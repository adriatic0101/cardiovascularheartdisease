export type CountyData = {
  county: string
  fips: string
  povertyRate: number
  belowPoverty: number
  women35Plus: number
  mortalityRate: number
  latitude: number
  longitude: number
}

export type MapVariable = 'povertyRate' | 'mortalityRate'
