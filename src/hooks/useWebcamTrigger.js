import { useEffect } from 'react'
import useGlobeStore from '../store/useGlobeStore'

const HIGH_PRIORITY = ['conflict', 'politics', 'top']
const TIME_WINDOW   = 2 * 60 * 60 * 1000  // 2 hours
const THRESHOLD     = 5

export function useWebcamTrigger(articles) {
  const setShowWebcams = useGlobeStore(s => s.setShowWebcams)

  useEffect(() => {
    const now = Date.now()
    const count = articles.filter(a =>
      HIGH_PRIORITY.includes(a.category) &&
      new Date(a.pubDate).getTime() > now - TIME_WINDOW
    ).length
    setShowWebcams(count >= THRESHOLD)
  }, [articles])
}
