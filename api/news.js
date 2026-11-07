import { fetchNews } from './services/newsdataService.js'
import cache from './services/cacheService.js'
export default async function handler(req, res) {
  const { countryCode = 'all', category = 'all', page = 1, source, mode = 'full' } = req.query
  const cacheKey = `news_${countryCode}_${category}_${page}_${source || 'all'}_${mode}`
  // Let Vercel's edge cache successful responses so repeat visits don't spend API credits
  const setEdgeCache = () => res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600')
  const cached = cache.get(cacheKey)
  if (cached) {
    setEdgeCache()
    return res.status(200).json(cached)
  }
  try {
    const data = await fetchNews({ countryCode, category, page, source, mode })
    if (data.error) {
      return res.status(data.status || 500).json(data)
    }
    cache.set(cacheKey, data)
    setEdgeCache()
    res.status(200).json(data)
  } catch (err) {
    console.error('Vercel News Function Error:', err.message)
    res.status(500).json({ error: true, message: err.message, articles: [] })
  }
}
