const express = require('express')
const router  = express.Router()
const { fetchNews } = require('../services/newsdataService')
const cache         = require('../services/cacheService')

// Support both / and /:countryCode
router.get(['/', '/:countryCode'], async (req, res) => {
  const countryCode = req.params.countryCode || 'all'
  const { category = 'all', page, source } = req.query

  const cacheKey = `news_${countryCode}_${category}_${page}`
  const cached   = cache.get(cacheKey)
  if (cached) return res.json(cached)

  try {
    const data = await fetchNews({ countryCode, category, page, source })
    cache.set(cacheKey, data)
    res.json(data)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'Failed to fetch news', articles: [] })
  }
})

module.exports = router
