import { useEffect } from 'react'
import useGlobeStore from '../store/useGlobeStore'

const HIGH_PRIORITY = ['conflict', 'politics', 'top', 'economy', 'environment']
const TIME_WINDOW   = 24 * 60 * 60 * 1000  // 24 hours (broader window for testing)
const THRESHOLD     = 1 // Show if even 1 relevant article exists

export function useWebcamTrigger(articles, countryCode) {
  const { setShowWebcams, setWebcamStreams } = useGlobeStore()

  useEffect(() => {
    const now = Date.now()
    const relevantArticles = articles.filter(a =>
      HIGH_PRIORITY.includes(a.category) &&
      new Date(a.pubDate).getTime() > now - TIME_WINDOW
    )

    if (relevantArticles.length >= THRESHOLD && countryCode) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/webcams` : `${baseUrl}/api/webcams`
      
      fetch(`${endpoint}?country=${countryCode}`)
        .then(res => res.json())
        .then(data => {
          setWebcamStreams(data)
          setShowWebcams(true)
        })
        .catch(() => setShowWebcams(false))
    } else {
      setShowWebcams(false)
    }
  }, [articles, countryCode])
}
