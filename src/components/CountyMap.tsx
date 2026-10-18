import { useEffect, useMemo, useRef } from 'react'
import { AttributionControl, Map as MapLibreMap, NavigationControl, Popup, type MapLayerMouseEvent } from 'maplibre-gl'
import type { CountyData, MapVariable } from '../types'
import { quantiles } from '../statistics'

const palette = ['#e9f5f3', '#b8ded8', '#72beb5', '#2b938d', '#075f63']

type Props = {
  counties: CountyData[]
  variable: MapVariable
  selected: CountyData
  onSelect: (county: CountyData) => void
}

export function CountyMap({ counties, variable, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const countyLookup = useMemo(() => new Map(counties.map((county) => [county.fips, county])), [counties])
  const breaks = useMemo(() => quantiles(counties.map((county) => county[variable])), [counties, variable])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      center: [-119.45, 37.25],
      zoom: 4.7,
      minZoom: 4,
      maxZoom: 10,
      attributionControl: false,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f4f7f8' } }],
      },
    })

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new AttributionControl({ compact: true, customAttribution: 'County boundaries: U.S. Census' }))

    map.on('load', async () => {
      const response = await fetch('/data/california-counties.geojson')
      const geojson = await response.json()
      geojson.features = geojson.features.map((feature: { id: string; properties: Record<string, unknown> }) => {
        const record = countyLookup.get(feature.id)
        return { ...feature, properties: { ...feature.properties, ...record } }
      })

      map.addSource('counties', { type: 'geojson', data: geojson })
      map.addLayer({
        id: 'county-fill',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': ['step', ['get', variable], palette[0], breaks[0], palette[1], breaks[1], palette[2], breaks[2], palette[3], breaks[3], palette[4]],
          'fill-opacity': 0.92,
        },
      })
      map.addLayer({
        id: 'county-lines',
        type: 'line',
        source: 'counties',
        paint: { 'line-color': '#ffffff', 'line-width': 0.8 },
      })
      map.addLayer({
        id: 'county-selected',
        type: 'line',
        source: 'counties',
        filter: ['==', ['get', 'fips'], selected.fips],
        paint: { 'line-color': '#f2b64b', 'line-width': 3.2 },
      })

      const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
      popupRef.current = popup

      map.on('mousemove', 'county-fill', (event: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer'
        const properties = event.features?.[0]?.properties
        if (!properties || !event.lngLat) return
        const value = variable === 'povertyRate'
          ? `${Number(properties.povertyRate).toFixed(1)}% poverty`
          : `${Number(properties.mortalityRate).toFixed(1)} deaths per 100,000`
        const content = document.createElement('div')
        content.className = 'map-popup'
        const title = document.createElement('strong')
        title.textContent = `${properties.county} County`
        const detail = document.createElement('span')
        detail.textContent = value
        content.append(title, detail)
        popup.setLngLat(event.lngLat).setDOMContent(content).addTo(map)
      })

      map.on('mouseleave', 'county-fill', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      map.on('click', 'county-fill', (event: MapLayerMouseEvent) => {
        const fips = String(event.features?.[0]?.properties?.fips ?? '')
        const county = countyLookup.get(fips)
        if (county) onSelect(county)
      })
    })

    mapRef.current = map
    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [countyLookup, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer('county-fill')) return
    map.setPaintProperty('county-fill', 'fill-color', [
      'step', ['get', variable], palette[0], breaks[0], palette[1], breaks[1], palette[2], breaks[2], palette[3], breaks[3], palette[4],
    ])
  }, [breaks, variable])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer('county-selected')) return
    map.setFilter('county-selected', ['==', ['get', 'fips'], selected.fips])
  }, [selected])

  const formatBreak = (value: number) => variable === 'povertyRate' ? `${value.toFixed(1)}%` : value.toFixed(0)

  return (
    <div>
      <div ref={containerRef} className="h-[540px] w-full rounded-[1.25rem]" aria-label="Interactive choropleth map of California counties" />
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
        <span className="font-semibold uppercase tracking-[0.13em] text-slate-500">Lower</span>
        <div className="flex overflow-hidden rounded-full ring-1 ring-slate-200">
          {palette.map((color) => <span key={color} className="h-3 w-10" style={{ backgroundColor: color }} />)}
        </div>
        <span className="font-semibold uppercase tracking-[0.13em] text-slate-500">Higher</span>
        <span className="text-slate-400">Quintile cut points: {breaks.map(formatBreak).join(' · ')}</span>
      </div>
    </div>
  )
}
