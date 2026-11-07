import { useEffect } from 'react'
import useGlobeStore from '../store/useGlobeStore'

function newsUrl(countryCode) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const endpoint = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
  // Always fetch every category; the panel tabs filter client-side so
  // tab counts and globe marker counts come from the same articles.
  return `${endpoint}/news?countryCode=${countryCode}&category=all`
}

async function fetchArticles(countryCode, signal) {
  const res = await window.fetch(newsUrl(countryCode), { signal })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data.articles || []
}

/**
 * Loads the global feed once on mount, and each selected country's full feed
 * the first time it is opened. Results are merged into one shared pool.
 */
export function useNewsData(countryCode) {
  const mergeArticles     = useGlobeStore(s => s.mergeArticles)
  const markCountryLoaded = useGlobeStore(s => s.markCountryLoaded)
  const setLoadingNews    = useGlobeStore(s => s.setLoadingNews)
  const setNewsError      = useGlobeStore(s => s.setNewsError)

  // Global feed → populates markers worldwide
  useEffect(() => {
    const controller = new AbortController()
    fetchArticles('all', controller.signal)
      .then(mergeArticles)
      .catch(e => {
        if (e.name !== 'AbortError') console.warn('useNewsData: global fetch failed', e.message)
      })
    return () => controller.abort()
  }, [])

  // Country feed → deepens the selected country (fetched once per session)
  useEffect(() => {
    if (!countryCode) return
    const code = countryCode.toUpperCase()
    if (useGlobeStore.getState().loadedCountries[code]) return

    const controller = new AbortController()
    setLoadingNews(true)
    setNewsError(null)
    fetchArticles(code, controller.signal)
      .then(list => {
        mergeArticles(list)
        markCountryLoaded(code)
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          console.warn('useNewsData: country fetch failed', e.message)
          setNewsError(e.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingNews(false)
      })
    return () => {
      controller.abort()
      setLoadingNews(false)
    }
  }, [countryCode])
}
