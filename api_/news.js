import { fetchNews } from './services/newsdataService.js'
import cache from './services/cacheService.js'

export default async function handler(req, res) {
  const { countryCode = 'all', category = 'all', page = 1, source } = req.query
  const cacheKey = `news_${countryCode}_${category}_${page}_${source || 'all'}`

  const cached = cache.get(cacheKey)
  if (cached) return res.status(200).json(cached)

  try {
    const data = await fetchNews({ countryCode, category, page, source })
    cache.set(cacheKey, data)
    res.status(200).json(data)
  } catch (err) {
    console.error('Vercel News Function Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch news', articles: [] })
  }
}
