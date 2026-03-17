import { useEffect } from 'react'
import useGlobeStore from '../store/useGlobeStore'

export function useNewsData(countryCode, category) {
  const { setArticles, setLoadingNews, setNewsError } = useGlobeStore()

  useEffect(() => {
    const controller = new AbortController()
    const targetCountry = countryCode || 'all'

    async function fetchNews() {
      setLoadingNews(true)
      setNewsError(null)
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/news/${targetCountry}` +
          `?category=${category || 'all'}`
        const res = await window.fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setArticles(data.articles || [])
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('useNewsData: fetch failed', e.message)
          setNewsError(e.message)
          setArticles([])
        }
      } finally {
        setLoadingNews(false)
      }
    }

    fetchNews()
    return () => controller.abort()
  }, [countryCode, category])
}
