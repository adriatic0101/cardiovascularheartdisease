import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  type MapLayerMouseEvent,
} from 'maplibre-gl'
import type { CountyData, MapVariable } from '../types'
import { quantiles } from '../statistics'

const CALIFORNIA_BOUNDS: [[number, number], [number, number]] = [[-124.65, 32.35], [-113.75, 42.15]]

const variableConfig = {
  povertyRate: {
    title: 'Female Poverty Rate, Ages 35+',
    shortTitle: 'Poverty rate',
    unit: '%',
    palette: ['#edf8f6', '#c9e8e2', '#85c9bf', '#319b93', '#075f63'],
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  mortalityRate: {
    title: 'Female Heart Disease Mortality, Ages 35+',
    shortTitle: 'Mortality rate',
    unit: 'deaths per 100,000',
    palette: ['#fff4e6', '#fbd6a5', '#f1a45c', '#cf653f', '#8c2d35'],
    format: (value: number) => value.toFixed(1),
  },
} satisfies Record<MapVariable, {
  title: string
  shortTitle: string
  unit: string
  palette: string[]
  format: (value: number) => string
}>

type CountyFeature = {
  id?: string | number
  properties: Record<string, unknown>
  geometry: { coordinates: unknown }
}

type Props = {
  counties: CountyData[]
  variable: MapVariable
  selected: CountyData
  onSelect: (county: CountyData) => void
  focusRequest?: number
  compact?: boolean
}

function extendBounds(bounds: LngLatBounds, coordinates: unknown) {
  if (!Array.isArray(coordinates)) return
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    bounds.extend([coordinates[0], coordinates[1]])
    return
  }
  coordinates.forEach((coordinate) => extendBounds(bounds, coordinate))
}

export function CountyMap({ counties, variable, selected, onSelect, focusRequest = 0, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const featuresRef = useRef(new Map<string, CountyFeature>())
  const [mapError, setMapError] = useState<string | null>(null)
  const [verifiedCount, setVerifiedCount] = useState(0)
  const countyLookup = useMemo(() => new Map(counties.map((county) => [county.fips, county])), [counties])
  const values = useMemo(() => counties.map((county) => county[variable]), [counties, variable])
  const breaks = useMemo(() => quantiles(values), [values])
  const config = variableConfig[variable]

  const resetMap = () => {
    mapRef.current?.fitBounds(CALIFORNIA_BOUNDS, { padding: compact ? 26 : 42, duration: 700 })
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: MapLibreMap
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        center: [-119.45, 37.25],
        zoom: compact ? 4.25 : 4.7,
        minZoom: 3.5,
        maxZoom: 10,
        attributionControl: false,
        style: {
          version: 8,
          sources: {},
          layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f4f7f8' } }],
        },
      })
    } catch (error) {
      console.error('MapLibre initialization failed', error)
      setMapError('The interactive map requires a browser with WebGL2 support. All county data and statistical charts remain available below.')
      return
    }

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new AttributionControl({ compact: true, customAttribution: 'Boundaries: U.S. Census' }))

    map.on('load', async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/california-counties.geojson`)
        if (!response.ok) throw new Error(`County boundary request failed: ${response.status}`)
        const geojson = await response.json() as { type: 'FeatureCollection'; features: CountyFeature[] }
        if (geojson.features.length !== 58) throw new Error(`Expected 58 county polygons; found ${geojson.features.length}`)

        const matchedFips = new Set<string>()
        geojson.features = geojson.features.map((feature) => {
          const fips = String(feature.id ?? feature.properties.GEOID ?? '').padStart(5, '0')
          const record = countyLookup.get(fips)
          if (!record) throw new Error(`No processed data match for county polygon FIPS ${fips}`)
          if (matchedFips.has(fips)) throw new Error(`Duplicate county polygon FIPS ${fips}`)
          matchedFips.add(fips)
          featuresRef.current.set(fips, feature)
          return { ...feature, id: fips, properties: { ...feature.properties, ...record, fips } }
        })

        const missingFips = counties.filter((county) => !matchedFips.has(county.fips))
        if (matchedFips.size !== 58 || missingFips.length) {
          throw new Error(`Boundary join validation failed; missing FIPS: ${missingFips.map((county) => county.fips).join(', ')}`)
        }

        map.addSource('counties', { type: 'geojson', data: geojson })
        map.addLayer({
          id: 'county-fill',
          type: 'fill',
          source: 'counties',
          paint: {
            'fill-color': ['step', ['get', variable], config.palette[0], breaks[0], config.palette[1], breaks[1], config.palette[2], breaks[2], config.palette[3], breaks[3], config.palette[4]],
            'fill-opacity': 0.94,
          },
        })
        map.addLayer({ id: 'county-lines', type: 'line', source: 'counties', paint: { 'line-color': '#ffffff', 'line-width': 0.85 } })
        map.addLayer({
          id: 'county-hover',
          type: 'line',
          source: 'counties',
          filter: ['==', ['get', 'fips'], ''],
          paint: { 'line-color': '#0b2d45', 'line-width': 2.25 },
        })
        map.addLayer({
          id: 'county-selected',
          type: 'line',
          source: 'counties',
          filter: ['==', ['get', 'fips'], selected.fips],
          paint: { 'line-color': '#f2b64b', 'line-width': 3.5 },
        })

        const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        popupRef.current = popup

        map.on('mousemove', 'county-fill', (event: MapLayerMouseEvent) => {
          map.getCanvas().style.cursor = 'pointer'
          const properties = event.features?.[0]?.properties
          if (!properties || !event.lngLat) return
          map.setFilter('county-hover', ['==', ['get', 'fips'], String(properties.fips)])

          const content = document.createElement('div')
          content.className = 'map-popup map-popup-detailed'
          const title = document.createElement('strong')
          title.textContent = `${properties.county} County`
          const poverty = document.createElement('span')
          poverty.textContent = `Poverty: ${Number(properties.povertyRate).toFixed(1)}%`
          const mortality = document.createElement('span')
          mortality.textContent = `Mortality: ${Number(properties.mortalityRate).toFixed(1)} per 100,000`
          const instruction = document.createElement('small')
          instruction.textContent = 'Click for county details'
          content.append(title, poverty, mortality, instruction)
          popup.setLngLat(event.lngLat).setDOMContent(content).addTo(map)
        })

        map.on('mouseleave', 'county-fill', () => {
          map.getCanvas().style.cursor = ''
          map.setFilter('county-hover', ['==', ['get', 'fips'], ''])
          popup.remove()
        })

        map.on('click', 'county-fill', (event: MapLayerMouseEvent) => {
          const fips = String(event.features?.[0]?.properties?.fips ?? '')
          const county = countyLookup.get(fips)
          if (county) onSelect(county)
        })

        setVerifiedCount(matchedFips.size)
        map.fitBounds(CALIFORNIA_BOUNDS, { padding: compact ? 26 : 42, duration: 0 })
      } catch (error) {
        console.error('County map data failed to load', error)
        setMapError('County boundaries or their FIPS join could not be validated. All county data and statistical charts remain available below.')
      }
    })

    mapRef.current = map
    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [compact, countyLookup, counties, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer('county-fill')) return
    map.setPaintProperty('county-fill', 'fill-color', [
      'step', ['get', variable], config.palette[0], breaks[0], config.palette[1], breaks[1], config.palette[2], breaks[2], config.palette[3], breaks[3], config.palette[4],
    ])
  }, [breaks, config.palette, variable])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer('county-selected')) return
    map.setFilter('county-selected', ['==', ['get', 'fips'], selected.fips])
  }, [selected])

  useEffect(() => {
    if (!focusRequest) return
    const map = mapRef.current
    const feature = featuresRef.current.get(selected.fips)
    if (!map || !feature) return
    const bounds = new LngLatBounds()
    extendBounds(bounds, feature.geometry.coordinates)
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: compact ? 42 : 90, maxZoom: 7.2, duration: 750 })
  }, [compact, focusRequest, selected.fips, verifiedCount])

  const legendRanges = useMemo(() => {
    const format = config.format
    return [
      `< ${format(breaks[0])}`,
      `${format(breaks[0])}–${format(breaks[1])}`,
      `${format(breaks[1])}–${format(breaks[2])}`,
      `${format(breaks[2])}–${format(breaks[3])}`,
      `≥ ${format(breaks[3])}`,
    ]
  }, [breaks, config])

  if (mapError) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[1.25rem] bg-mist px-8 text-center">
        <div className="max-w-lg">
          <p className="eyebrow">Map unavailable</p>
          <p className="mt-3 text-lg leading-8 text-slate-600">{mapError}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <div ref={containerRef} className={`${compact ? 'h-[440px]' : 'h-[570px]'} w-full rounded-[1.25rem]`} aria-label={`Interactive choropleth map: ${config.title}`} />
        <button type="button" className="map-reset" onClick={resetMap} aria-label="Reset map to all of California">Reset view</button>
        {verifiedCount === 58 && <span className="map-verified">58 / 58 FIPS matched</span>}
      </div>
      <div className="map-legend" aria-label={`${config.title} legend`}>
        <div className="map-legend-title"><strong>{config.shortTitle}</strong><span>{config.unit}</span></div>
        <div className="map-legend-bins">
          {config.palette.map((color, index) => (
            <div key={color} className="map-legend-bin">
              <span className="map-legend-swatch" style={{ backgroundColor: color }} />
              <span>{legendRanges[index]}</span>
            </div>
          ))}
        </div>
        <p>Data-derived quintiles; values shown are the observed county measures.</p>
      </div>
    </div>
  )
}
