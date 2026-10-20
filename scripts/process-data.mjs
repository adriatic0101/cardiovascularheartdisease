import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parse } from 'csv-parse/sync'

const acsPath = 'data/ACSDT5Y2024.B17001-2026-10-18T210821.csv'
const mortalityPath = 'data/Heart_Disease_Mortality_Data_Among_US_Adults_(35+)_by_State_Territory_and_County_–_2022-2024_20261017.csv'
const processedPath = 'data/processed/california_county_poverty_heart_mortality.csv'
const publicProcessedPath = 'public/data/california_county_poverty_heart_mortality.csv'

const cleanLabel = (value) => String(value).replaceAll('\u00a0', ' ').trim()
const parseRequiredNumber = (value, context) => {
  const normalized = String(value ?? '').replaceAll(',', '').trim()
  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Missing or invalid numeric value for ${context}: ${JSON.stringify(value)}`)
  }
  return Number(normalized)
}
const csvCell = (value) => {
  const cell = String(value)
  return /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell
}

const acsRows = parse(readFileSync(acsPath, 'utf8').replace(/^\uFEFF/, ''), { relax_column_count: true })
const [acsHeader] = acsRows
const ageGroups = ['35 to 44 years', '45 to 54 years', '55 to 64 years', '65 to 74 years', '75 years and over']
const belowRows = [26, 27, 28, 29, 30]
const aboveRows = [55, 56, 57, 58, 59]

if (cleanLabel(acsRows[2][0]) !== 'Income in the past 12 months below poverty level:') {
  throw new Error('ACS below-poverty section label was not found at the expected row.')
}
if (cleanLabel(acsRows[17][0]) !== 'Female:') {
  throw new Error('ACS female label in the below-poverty section was not found at the expected row.')
}
if (cleanLabel(acsRows[31][0]) !== 'Income in the past 12 months at or above poverty level:') {
  throw new Error('ACS at-or-above-poverty section label was not found at the expected row.')
}
if (cleanLabel(acsRows[46][0]) !== 'Female:') {
  throw new Error('ACS female label in the at-or-above-poverty section was not found at the expected row.')
}
for (let index = 0; index < ageGroups.length; index += 1) {
  const expected = ageGroups[index]
  if (cleanLabel(acsRows[belowRows[index]][0]) !== expected || cleanLabel(acsRows[aboveRows[index]][0]) !== expected) {
    throw new Error(`ACS demographic row validation failed for ${expected}.`)
  }
}

const mortalityRows = parse(readFileSync(mortalityPath, 'utf8').replace(/^\uFEFF/, ''), {
  columns: true,
  skip_empty_lines: true,
})
const targetMortalityRows = mortalityRows.filter((row) =>
  row.LocationAbbr === 'CA' &&
  row.GeographicLevel === 'County' &&
  row.StratificationCategory1 === 'Sex' &&
  row.Stratification1 === 'Female' &&
  row.StratificationCategory2 === 'Race/Ethnicity' &&
  row.Stratification2 === 'Overall' &&
  row.Topic === 'Heart Disease Mortality' &&
  row.Data_Value_Type === 'Age-adjusted, Spatially Smoothed, 3-year Average Rate' &&
  row.Data_Value_Unit === 'per 100,000 population'
)
if (targetMortalityRows.length !== 58) {
  throw new Error(`Expected 58 filtered CDC rows; found ${targetMortalityRows.length}.`)
}

const mortalityByCounty = new Map()
const observedFips = new Set()
for (const row of targetMortalityRows) {
  const county = row.LocationDesc.replace(/ County$/, '')
  if (mortalityByCounty.has(county)) throw new Error(`Duplicate CDC county: ${county}`)
  if (observedFips.has(row.LocationID)) throw new Error(`Duplicate CDC FIPS code: ${row.LocationID}`)
  parseRequiredNumber(row.Data_Value, `${county} County female mortality rate`)
  mortalityByCounty.set(county, row)
  observedFips.add(row.LocationID)
}

const processedRows = []
const observedAcsCounties = new Set()
for (let column = 1; column < acsHeader.length; column += 2) {
  const header = acsHeader[column]
  const match = header.match(/^(.+) County, California!!Estimate$/)
  if (!match) throw new Error(`Unexpected ACS county estimate header: ${header}`)
  const county = match[1]
  if (observedAcsCounties.has(county)) throw new Error(`Duplicate ACS county: ${county}`)
  observedAcsCounties.add(county)

  const belowByAge = belowRows.map((row, index) => parseRequiredNumber(acsRows[row][column], `${county} County below poverty, ${ageGroups[index]}`))
  const aboveByAge = aboveRows.map((row, index) => parseRequiredNumber(acsRows[row][column], `${county} County at or above poverty, ${ageGroups[index]}`))
  const womenBelowPoverty = belowByAge.reduce((sum, value) => sum + value, 0)
  const womenAtOrAbovePoverty = aboveByAge.reduce((sum, value) => sum + value, 0)
  const womenWithStatus = womenBelowPoverty + womenAtOrAbovePoverty
  if (womenWithStatus <= 0) throw new Error(`Non-positive poverty-status denominator for ${county} County.`)

  const mortality = mortalityByCounty.get(county)
  if (!mortality) throw new Error(`No matching CDC county for ACS county ${county}.`)
  processedRows.push({
    county_name: `${county} County`,
    county_fips: mortality.LocationID,
    women_35_plus_below_poverty: womenBelowPoverty,
    women_35_plus_poverty_status_determined: womenWithStatus,
    female_poverty_rate_percent: Number(((womenBelowPoverty / womenWithStatus) * 100).toFixed(4)),
    female_heart_disease_mortality_rate_per_100000: parseRequiredNumber(mortality.Data_Value, `${county} County female mortality rate`),
  })
}

const unmatchedCdc = [...mortalityByCounty.keys()].filter((county) => !observedAcsCounties.has(county))
if (processedRows.length !== 58 || observedAcsCounties.size !== 58 || unmatchedCdc.length > 0) {
  throw new Error(`County validation failed: rows=${processedRows.length}, unique ACS=${observedAcsCounties.size}, unmatched CDC=${unmatchedCdc.join(', ') || 'none'}`)
}

processedRows.sort((a, b) => a.county_fips.localeCompare(b.county_fips))
const outputHeaders = [
  'county_name',
  'county_fips',
  'women_35_plus_below_poverty',
  'women_35_plus_poverty_status_determined',
  'female_poverty_rate_percent',
  'female_heart_disease_mortality_rate_per_100000',
]
const outputCsv = [
  outputHeaders.join(','),
  ...processedRows.map((row) => outputHeaders.map((header) => csvCell(row[header])).join(',')),
].join('\n') + '\n'

mkdirSync('data/processed', { recursive: true })
mkdirSync('public/data', { recursive: true })
mkdirSync('src/data', { recursive: true })
writeFileSync(processedPath, outputCsv)
writeFileSync(publicProcessedPath, outputCsv)

// All application records are generated from the validated merged table above.
// The React application never reads or independently combines the raw CSV files.
const applicationRows = processedRows.map((row) => ({
  county: row.county_name.replace(/ County$/, ''),
  fips: row.county_fips,
  povertyRate: row.female_poverty_rate_percent,
  belowPoverty: row.women_35_plus_below_poverty,
  women35Plus: row.women_35_plus_poverty_status_determined,
  mortalityRate: row.female_heart_disease_mortality_rate_per_100000,
}))
writeFileSync('src/data/counties.json', `${JSON.stringify(applicationRows, null, 2)}\n`)

console.log(`Validated and merged exactly ${processedRows.length} unique California counties.`)
console.log(`Processed CSV: ${processedPath}`)
