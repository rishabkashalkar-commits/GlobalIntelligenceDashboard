import { useEffect } from 'react'
import useGlobeStore from '../store/useGlobeStore'

// Countries the news API can resolve (mirrors ISO_TO_NAME in api/services/newsdataService.js)
const SUPPORTED = new Set([
  'IN','US','GB','FR','DE','JP','CN','AU','BR','RU','IR','SA','ZA','NG','EG',
  'MX','AR','ID','PK','TR','CA','KR','ES','IT','UA','PL','AE','IL','TW','BD',
  'LK','NP','IQ','SY','YE','JO','LB','GR','PH',
])
// Fallback order used to fill the preload list
const PRIORITY = ['US','GB','IN','CN','RU','UA','IL','IR','DE','FR','JP','BR']
const PRELOAD_LIMIT = 12
const PRELOAD_CONCURRENCY = 3

// Shared across renders so a click during preload reuses the in-flight request
const inFlight = new Map()

function newsUrl(countryCode) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const endpoint = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
  if (countryCode === 'all') return `${endpoint}/news?countryCode=all&category=all`
  // Country feeds use the 1-credit "lite" mode (see api/services/newsdataService.js)
  return `${endpoint}/news?countryCode=${countryCode}&category=all&mode=lite`
}

async function fetchArticles(countryCode, signal) {
  const res = await window.fetch(newsUrl(countryCode), { signal })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data.articles || []
}

// Fetch one country's feed once per session and merge it into the shared pool
function loadCountry(code) {
  const store = useGlobeStore.getState()
  if (store.loadedCountries[code]) return Promise.resolve()
  if (inFlight.has(code)) return inFlight.get(code)

  const p = fetchArticles(code)
    .then(list => {
      const s = useGlobeStore.getState()
      s.mergeArticles(list)
      s.markCountryLoaded(code)
    })
    .finally(() => inFlight.delete(code))
  inFlight.set(code, p)
  return p
}

function preloadList(articles) {
  const counts = {}
  articles.forEach(a => {
    const c = (a.country_code || '').toUpperCase()
    if (SUPPORTED.has(c)) counts[c] = (counts[c] || 0) + 1
  })
  const fromFeed = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  return [...new Set([...fromFeed, ...PRIORITY])].slice(0, PRELOAD_LIMIT)
}

async function preload(codes, isCancelled) {
  const queue = [...codes]
  const worker = async () => {
    while (queue.length && !isCancelled()) {
      const code = queue.shift()
      try { await loadCountry(code) } catch (e) {
        console.warn(`useNewsData: preload ${code} failed`, e.message)
      }
    }
  }
  await Promise.all(Array.from({ length: PRELOAD_CONCURRENCY }, worker))
}

/**
 * 1. Loads the global feed on mount.
 * 2. Preloads the busiest / key countries in the background so every marker
 *    on the globe already reflects that country's full feed before any click.
 * 3. Loads any other country the first time it is selected.
 * Everything merges into one pool, so globe counts and panel lists always match.
 */
export function useNewsData(countryCode) {
  const setLoadingNews = useGlobeStore(s => s.setLoadingNews)
  const setNewsError   = useGlobeStore(s => s.setNewsError)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    fetchArticles('all', controller.signal)
      .then(list => {
        if (cancelled) return
        useGlobeStore.getState().mergeArticles(list)
        return preload(preloadList(list), () => cancelled)
      })
      .catch(e => {
        if (e.name !== 'AbortError') console.warn('useNewsData: global fetch failed', e.message)
        // Still preload key countries so the globe isn't empty
        if (!cancelled) preload(PRIORITY, () => cancelled)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!countryCode) return
    const code = countryCode.toUpperCase()
    if (useGlobeStore.getState().loadedCountries[code]) return

    let active = true
    setLoadingNews(true)
    setNewsError(null)
    loadCountry(code)
      .catch(e => { if (active) setNewsError(e.message) })
      .finally(() => { if (active) setLoadingNews(false) })
    return () => {
      active = false
      setLoadingNews(false)
    }
  }, [countryCode])
}
