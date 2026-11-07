import { CATEGORIES, CATEGORY_COLORS } from '../../lib/constants'
import useGlobeStore from '../../store/useGlobeStore'

const ONE_HOUR = 3600000
const LABELED_COUNT = 6

// Cache of marker DOM nodes keyed by country code, so layer toggles update in place
const markerCache = new Map()

export function resetMarkers() {
  markerCache.clear()
}

const rgb = (cat, a = 1) => {
  const c = CATEGORY_COLORS[cat] || [226, 232, 240]
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
}

const catLabel = (cat) => CATEGORIES.find(c => c.id === cat)?.label || cat

export function getCountryName(code) {
  if (!code) return 'Unknown'
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code
  } catch {
    return code
  }
}

export default function MarkerLayer(globe, articles, setTooltip) {
  const { activeLayers } = useGlobeStore.getState()
  const now = Date.now()

  // 1. Aggregate one entry per country (active layers only)
  const countries = {}
  articles.forEach(a => {
    if (!a.country_code || !activeLayers.includes(a.category)) return
    const code = a.country_code.toUpperCase()
    const lat = a.lat ?? getCountryLat(code)
    const lng = a.lng ?? getCountryLng(code)
    if (!lat && !lng) return

    const entry = countries[code] ||= {
      code, lat, lng, total: 0, counts: {}, isBreaking: false, latest: null,
    }
    entry.total += 1
    entry.counts[a.category] = (entry.counts[a.category] || 0) + 1

    const t = new Date(a.pubDate).getTime()
    if (now - t < ONE_HOUR) entry.isBreaking = true
    if (!entry.latest || t > entry.latestTime) {
      entry.latest = a
      entry.latestTime = t
    }
  })

  const markers = Object.values(countries).map(c => {
    const breakdown = Object.entries(c.counts).sort((a, b) => b[1] - a[1])
    return {
      ...c,
      breakdown,
      dominant: breakdown[0][0],
      headline: c.latest?.title || '',
      size: Math.min(24, 8 + 3.5 * Math.sqrt(c.total)),
    }
  })

  // Top countries by volume get an always-on floating label
  const labeled = new Set(
    [...markers].sort((a, b) => b.total - a.total).slice(0, LABELED_COUNT).map(m => m.code)
  )
  markers.forEach(m => { m.labeled = labeled.has(m.code) })

  // Drop cached elements for countries that no longer have markers
  const live = new Set(markers.map(m => m.code))
  for (const code of markerCache.keys()) if (!live.has(code)) markerCache.delete(code)

  // 2. Render
  globe
    .pointsData([])
    .ringsData([])
    .htmlElementsData(markers)
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude(0.012)
    .htmlTransitionDuration(0)
    .htmlElement(d => {
      let el = markerCache.get(d.code)
      if (!el) {
        el = createMarkerEl(globe, setTooltip)
        markerCache.set(d.code, el)
      }
      updateMarkerEl(el, d)
      return el
    })
    .htmlElementVisibilityModifier((el, visible) => {
      el.classList.toggle('is-hidden', !visible)
    })
}

function createMarkerEl(globe, setTooltip) {
  const el = document.createElement('div')
  el.className = 'gi-marker'
  el.innerHTML = `
    <div class="gi-marker__dot">
      <span class="gi-marker__pulse"></span>
      <span class="gi-marker__ring"></span>
      <span class="gi-marker__core"></span>
    </div>
    <div class="gi-marker__label">
      <span class="gi-marker__leader"></span>
      <div class="gi-marker__card">
        <div class="gi-marker__country"></div>
        <div class="gi-marker__meta"></div>
      </div>
    </div>
  `

  const showTooltip = (e) => {
    const d = el.__data
    if (!d) return
    setTooltip({
      code: d.code,
      total: d.total,
      breakdown: d.breakdown,
      headline: d.headline,
      isBreaking: d.isBreaking,
      x: e.clientX,
      y: e.clientY,
    })
  }

  el.addEventListener('mouseenter', (e) => {
    el.classList.add('is-hover')
    globe.controls().autoRotate = false
    showTooltip(e)
  })
  el.addEventListener('mousemove', showTooltip)
  el.addEventListener('mouseleave', () => {
    el.classList.remove('is-hover')
    setTooltip(null)
  })
  el.addEventListener('pointerdown', e => e.stopPropagation())
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    const d = el.__data
    if (!d) return
    const store = useGlobeStore.getState()
    store.setActiveCategory('all')
    store.setSelectedCountry(d.code)
    store.openPanel()
  })

  return el
}

function updateMarkerEl(el, d) {
  el.__data = d
  el.style.setProperty('--size', `${d.size}px`)
  el.style.setProperty('--c', rgb(d.dominant))
  el.style.setProperty('--c-soft', rgb(d.dominant, 0.45))

  // Conic ring showing the category mix
  let acc = 0
  const stops = d.breakdown.map(([cat, n]) => {
    const from = (acc / d.total) * 360
    acc += n
    const to = (acc / d.total) * 360
    return `${rgb(cat)} ${from}deg ${to}deg`
  })
  el.style.setProperty('--ring', `conic-gradient(${stops.join(', ')})`)

  el.classList.toggle('is-breaking', d.isBreaking)
  el.classList.toggle('is-labeled', d.labeled)

  el.querySelector('.gi-marker__country').textContent = getCountryName(d.code)
  el.querySelector('.gi-marker__meta').textContent =
    `${d.total} ${d.total === 1 ? 'event' : 'events'} · ${catLabel(d.dominant)}`
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
