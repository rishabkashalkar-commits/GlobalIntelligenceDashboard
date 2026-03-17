import { CATEGORIES, CATEGORY_COLORS } from '../../lib/constants'
import useGlobeStore from '../../store/useGlobeStore'

export default function MarkerLayer(globe, articles, setTooltip) {
  const { activeLayers, setSelectedCountry, openPanel } = useGlobeStore.getState()
  const now = Date.now()
  const ONE_HOUR = 3600000

  // 1. Group by country and category
  const countryData = {}
  
  articles.forEach(a => {
    const lat = a.lat || getCountryLat(a.country_code)
    const lng = a.lng || getCountryLng(a.country_code)
    
    if (lat === 0 && lng === 0) return

    if (!countryData[a.country_code]) {
      countryData[a.country_code] = {
        lat, lng, totalEvents: 0, categories: {}
      }
    }
    
    const cat = a.category
    if (!countryData[a.country_code].categories[cat]) {
      countryData[a.country_code].categories[cat] = {
        count: 0, isBreaking: false, articles: []
      }
    }
    
    countryData[a.country_code].categories[cat].count += 1
    countryData[a.country_code].totalEvents += 1
    countryData[a.country_code].categories[cat].articles.push(a)
    
    if ((now - new Date(a.pubDate).getTime()) < ONE_HOUR) {
      countryData[a.country_code].categories[cat].isBreaking = true
    }
  })

  // 2. Process data for native globe primitives
  const pointMarkers = []
  const ringMarkers = []

  Object.entries(countryData).forEach(([country_code, data]) => {
    const activeCats = Object.keys(data.categories).filter(c => activeLayers.includes(c))
    const numCats = activeCats.length
    
    activeCats.forEach((cat, index) => {
      const catData = data.categories[cat]
      const angle = numCats > 1 ? (index * (2 * Math.PI) / numCats) : 0
      const offsetMultiplier = numCats > 1 ? 2.5 : 0
      
      const latOffset = Math.cos(angle) * offsetMultiplier
      const lngOffset = Math.sin(angle) * offsetMultiplier

      const marker = {
        country_code,
        category: cat,
        lat: data.lat + latOffset,
        lng: data.lng + lngOffset,
        radius: catData.isBreaking ? 0.8 : 0.5,
        color: CATEGORY_COLORS[cat] || [255, 255, 255],
        articles: catData.articles,
        count: catData.count,
        isBreaking: catData.isBreaking
      }

      pointMarkers.push(marker)
      if (marker.isBreaking) {
        ringMarkers.push(marker)
      }
    })
  })

  // 3. Apply to Globe using Native Methods
  // Note: globe.gl methods return the instance for chaining
  globe
    .pointsData(pointMarkers)
    .pointLat('lat')
    .pointLng('lng')
    .pointColor(d => `rgba(${d.color[0]}, ${d.color[1]}, ${d.color[2]}, 0.85)`)
    .pointRadius('radius')
    .pointAltitude(0.01)
    .onPointHover((d, event) => {
      if (d && event) {
        setTooltip({ 
          data: { ...d.articles[0], count: d.count, country_code: d.country_code }, 
          x: event.clientX, 
          y: event.clientY, 
          category: d.category,
          count: d.count
        })
      } else {
        setTooltip(null)
      }
    })
    .onPointClick(d => {
      if (d) {
        useGlobeStore.getState().setSelectedCountry(d.country_code)
        useGlobeStore.getState().openPanel()
      }
    })

  // Add Pulse Rings for breaking news
  globe
    .ringsData(ringMarkers)
    .ringLat('lat')
    .ringLng('lng')
    .ringColor(d => `rgba(${d.color[0]}, ${d.color[1]}, ${d.color[2]}, 1)`)
    .ringMaxRadius(3)
    .ringPropagationSpeed(2)
    .ringRepeatPeriod(1000)

  console.log(`MarkerLayer: Rendered ${pointMarkers.length} points, ${ringMarkers.length} pulse rings.`)
}

// Capital city coordinates (kept for lat/lng lookup)
const COUNTRY_COORDS = {
  US: [38.9,  -77.0], GB: [51.5,  -0.1],  FR: [48.9,   2.3],
  DE: [52.5,  13.4],  IN: [28.6,  77.2],  CN: [39.9,  116.4],
  JP: [35.7,  139.7], AU: [-35.3, 149.1], BR: [-15.8, -47.9],
  RU: [55.8,  37.6],  IR: [35.7,  51.4],  SA: [24.7,  46.7],
  ZA: [-25.7,  28.2], NG: [9.1,    7.5],  EG: [30.1,  31.2],
  MX: [19.4, -99.1],  AR: [-34.6, -58.4], ID: [-6.2,  106.8],
  PK: [33.7,  73.1],  TR: [39.9,  32.9],  CA: [45.4, -75.7],
  KR: [37.5, 126.9],  ES: [40.4, -3.7],   IT: [41.9, 12.5],
  UA: [50.4, 30.5],   PL: [52.2, 21.0],   AE: [24.4, 54.3],
  IL: [31.7, 35.2],   TW: [25.0, 121.5],  BD: [23.8, 90.4],
  LK: [6.9, 79.9],    NP: [27.7, 85.3],   IQ: [33.3, 44.3],
  SY: [33.5, 36.3],   YE: [15.3, 44.2],   JO: [31.9, 35.9],
  LB: [33.8, 35.5],   GR: [37.9, 23.7],   IE: [53.3, -6.2],
  PH: [14.6, 120.9],  NL: [52.4, 4.9],    BE: [50.8, 4.3],
  SE: [59.3, 18.1],   NO: [59.9, 10.7],   DK: [55.7, 12.6],
  FI: [60.2, 24.9],   CH: [46.9, 7.4],    AT: [48.2, 16.4],
  PT: [38.7, -9.1],   NZ: [-41.3, 174.8], SG: [1.3, 103.8],
  MY: [3.1, 101.7],   TH: [13.7, 100.5],  VN: [21.0, 105.8],
}

export function getCountryLat(code) { 
  if (!code) return 0
  return COUNTRY_COORDS[code.toUpperCase()]?.[0] ?? 0 
}
export function getCountryLng(code) { 
  if (!code) return 0
  return COUNTRY_COORDS[code.toUpperCase()]?.[1] ?? 0 
}
