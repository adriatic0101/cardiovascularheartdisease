import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parse } from 'csv-parse/sync'

const acsPath = 'data/ACSDT5Y2024.B17001-2026-10-18T210821.csv'
const mortalityPath = 'data/Heart_Disease_Mortality_Data_Among_US_Adults_(35+)_by_State_Territory_and_County_–_2022-2024_20261017.csv'

const acsRows = parse(readFileSync(acsPath, 'utf8').replace(/^\uFEFF/, ''), { relax_column_count: true })
const [acsHeader] = acsRows
const numberAt = (row, column) => Number(String(acsRows[row][column]).replaceAll(',', ''))

const mortalityRows = parse(readFileSync(mortalityPath, 'utf8').replace(/^\uFEFF/, ''), {
  columns: true,
  skip_empty_lines: true,
})

const mortalityByCounty = new Map(
  mortalityRows
    .filter((row) =>
      row.LocationAbbr === 'CA' &&
      row.GeographicLevel === 'County' &&
      row.Stratification1 === 'Female' &&
      row.Stratification2 === 'Overall' &&
      row.Data_Value,
    )
    .map((row) => [row.LocationDesc.replace(/ County$/, ''), row]),
)

const counties = []
for (let column = 1; column < acsHeader.length; column += 2) {
  const county = acsHeader[column].replace(/ County, California!!Estimate$/, '')
  const belowPoverty = [26, 27, 28, 29, 30].reduce((sum, row) => sum + numberAt(row, column), 0)
  const atOrAbovePoverty = [55, 56, 57, 58, 59].reduce((sum, row) => sum + numberAt(row, column), 0)
  const mortality = mortalityByCounty.get(county)
  if (!mortality) throw new Error(`Missing female overall mortality record for ${county} County`)

  counties.push({
    county,
    fips: mortality.LocationID,
    povertyRate: Number(((belowPoverty / (belowPoverty + atOrAbovePoverty)) * 100).toFixed(4)),
    belowPoverty,
    women35Plus: belowPoverty + atOrAbovePoverty,
    mortalityRate: Number(mortality.Data_Value),
    latitude: Number(mortality.Y_lat),
    longitude: Number(mortality.X_lon),
  })
}

if (counties.length !== 58) throw new Error(`Expected 58 counties; generated ${counties.length}`)

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/counties.json', `${JSON.stringify(counties, null, 2)}\n`)
console.log(`Generated ${counties.length} county records from the source CSV files.`)
