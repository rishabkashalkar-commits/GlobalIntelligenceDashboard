import { CATEGORIES, CATEGORY_COLORS } from '../../lib/constants'
import useGlobeStore from '../../store/useGlobeStore'

const ONE_HOUR = 3600000
const LABELED_COUNT = 6
const CATEGORY_ORDER = CATEGORIES.map(c => c.id)

// Cache of marker DOM nodes keyed by `${kind}:${code}:${cat}`, so layer
// toggles and data merges update in place instead of flickering
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

// Ring radius (degrees) for a cluster of n category dots around a country
const clusterRadius = (n) => (n <= 1 ? 0 : 1.2 + 0.45 * n)

export default function MarkerLayer(globe, articles, setTooltip) {
  const { activeLayers } = useGlobeStore.getState()
  const now = Date.now()

  // 1. Aggregate per country → per category (active layers only)
  const countries = {}
  articles.forEach(a => {
    if (!a.country_code || !activeLayers.includes(a.category)) return
    const code = a.country_code.toUpperCase()
    const lat = a.lat ?? getCountryLat(code)
    const lng = a.lng ?? getCountryLng(code)
    if (!lat && !lng) return

    const country = countries[code] ||= { code, lat, lng, total: 0, cats: {} }
    const cat = country.cats[a.category] ||= {
      count: 0, isBreaking: false, latest: null, latestTime: -Infinity,
    }
    country.total += 1
    cat.count += 1

    const t = new Date(a.pubDate).getTime() || 0
    if (now - t < ONE_HOUR) cat.isBreaking = true
    if (t > cat.latestTime) {
      cat.latest = a
      cat.latestTime = t
    }
  })

  // 2. Build one dot per (country, category), scattered on a small ring
  const items = []
  const countryList = Object.values(countries)
  const labeled = new Set(
    [...countryList].sort((a, b) => b.total - a.total).slice(0, LABELED_COUNT).map(c => c.code)
  )

  countryList.forEach(c => {
    const breakdown = Object.entries(c.cats)
      .map(([cat, d]) => [cat, d.count])
      .sort((a, b) => b[1] - a[1])
    // Stable placement: categories keep the same slot regardless of counts
    const cats = Object.keys(c.cats).sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
    const n = cats.length
    const r = clusterRadius(n)
    const lngScale = 1 / Math.max(0.35, Math.cos((c.lat * Math.PI) / 180))
    const countryBreaking = cats.some(cat => c.cats[cat].isBreaking)

    cats.forEach((cat, i) => {
      const d = c.cats[cat]
      const angle = (i / n) * Math.PI * 2 // 0 = north, clockwise
      items.push({
        kind: 'dot',
        key: `dot:${c.code}:${cat}`,
        code: c.code,
        category: cat,
        lat: c.lat + Math.cos(angle) * r,
        lng: c.lng + Math.sin(angle) * r * lngScale,
        count: d.count,
        isBreaking: d.isBreaking,
        headline: d.latest?.title || '',
        total: c.total,
        breakdown,
        size: Math.min(26, 15 + 2.5 * Math.sqrt(d.count)),
      })
    })

    if (labeled.has(c.code)) {
      items.push({
        kind: 'label',
        key: `label:${c.code}`,
        code: c.code,
        lat: c.lat + r + 0.8,
        lng: c.lng,
        total: c.total,
        breakdown,
        isBreaking: countryBreaking,
        headline: c.cats[breakdown[0][0]].latest?.title || '',
      })
    }
  })

  // Drop cached elements that are no longer rendered
  const live = new Set(items.map(i => i.key))
  for (const key of markerCache.keys()) if (!live.has(key)) markerCache.delete(key)

  // 3. Render
  globe
    .pointsData([])
    .ringsData([])
    .htmlElementsData(items)
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude(d => (d.kind === 'label' ? 0.02 : 0.012))
    .htmlTransitionDuration(0)
    .htmlElement(d => {
      let el = markerCache.get(d.key)
      if (!el) {
        el = d.kind === 'label' ? createLabelEl(setTooltip) : createDotEl(globe, setTooltip)
        markerCache.set(d.key, el)
      }
      if (d.kind === 'label') updateLabelEl(el, d)
      else updateDotEl(el, d)
      return el
    })
    .htmlElementVisibilityModifier((el, visible) => {
      el.classList.toggle('is-hidden', !visible)
    })
}

function openCountry(code, category = 'all') {
  const store = useGlobeStore.getState()
  store.setActiveCategory(category)
  store.setSelectedCountry(code)
  store.openPanel()
}

function bindInteractions(el, setTooltip, onEnter) {
  const show = (e) => {
    const d = el.__data
    if (!d) return
    setTooltip({
      code: d.code,
      category: d.category || null,
      count: d.count ?? d.total,
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
    onEnter?.()
    show(e)
  })
  el.addEventListener('mousemove', show)
  el.addEventListener('mouseleave', () => {
    el.classList.remove('is-hover')
    setTooltip(null)
  })
  el.addEventListener('pointerdown', e => e.stopPropagation())
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    const d = el.__data
    if (d) openCountry(d.code, d.category || 'all')
  })
}

function createDotEl(globe, setTooltip) {
  const el = document.createElement('div')
  el.className = 'gi-dot'
  el.innerHTML = `
    <span class="gi-dot__pulse"></span>
    <span class="gi-dot__body"><span class="gi-dot__count"></span></span>
  `
  bindInteractions(el, setTooltip, () => { globe.controls().autoRotate = false })
  return el
}

function updateDotEl(el, d) {
  el.__data = d
  el.style.setProperty('--size', `${d.size}px`)
  el.style.setProperty('--c', rgb(d.category))
  el.style.setProperty('--c-soft', rgb(d.category, 0.45))
  el.classList.toggle('is-breaking', d.isBreaking)
  el.querySelector('.gi-dot__count').textContent = d.count
}

function createLabelEl(setTooltip) {
  const el = document.createElement('div')
  el.className = 'gi-label'
  el.innerHTML = `
    <span class="gi-label__leader"></span>
    <div class="gi-label__card">
      <div class="gi-label__country"></div>
      <div class="gi-label__total"></div>
      <div class="gi-label__chips"></div>
    </div>
  `
  bindInteractions(el, setTooltip)
  return el
}

function updateLabelEl(el, d) {
  el.__data = d
  el.classList.toggle('is-breaking', d.isBreaking)
  el.querySelector('.gi-label__country').textContent = getCountryName(d.code)
  el.querySelector('.gi-label__total').textContent =
    `${d.total} ${d.total === 1 ? 'event' : 'events'}`
  el.querySelector('.gi-label__chips').innerHTML = d.breakdown
    .map(([cat, n]) =>
      `<span class="gi-label__chip" title="${catLabel(cat)}" style="--c:${rgb(cat)}"><i></i>${n}</span>`)
    .join('')
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
