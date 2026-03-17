import axios from 'axios'

// Map of common country names returned by NewsData to ISO codes
const COUNTRY_NAME_TO_ISO = {
  'INDIA': 'IN', 'UNITED STATES OF AMERICA': 'US', 'UNITED STATES': 'US',
  'UNITED KINGDOM': 'GB', 'GREAT BRITAIN': 'GB', 'FRANCE': 'FR',
  'GERMANY': 'DE', 'JAPAN': 'JP', 'CHINA': 'CN', 'AUSTRALIA': 'AU',
  'BRAZIL': 'BR', 'RUSSIA': 'RU', 'IRAN': 'IR', 'SAUDI ARABIA': 'SA',
  'SOUTH AFRICA': 'ZA', 'NIGERIA': 'NG', 'EGYPT': 'EG', 'MEXICO': 'MX',
  'ARGENTINA': 'AR', 'INDONESIA': 'ID', 'PAKISTAN': 'PK', 'TURKEY': 'TR',
  'CANADA': 'CA', 'SOUTH KOREA': 'KR', 'SPAIN': 'ES', 'ITALY': 'IT',
  'UKRAINE': 'UA', 'POLAND': 'PL', 'UNITED ARAB EMIRATES': 'AE',
  'ISRAEL': 'IL', 'TAIWAN': 'TW', 'BANGLADESH': 'BD', 'SRI LANKA': 'LK',
  'NEPAL': 'NP', 'IRAQ': 'IQ', 'SYRIA': 'SY', 'YEMEN': 'YE',
  'JORDAN': 'JO', 'LEBANON': 'LB', 'GREECE': 'GR', 'NETHERLANDS': 'NL',
  'BELGIUM': 'BE', 'SWEDEN': 'SE', 'NORWAY': 'NO', 'DENMARK': 'DK',
  'FINLAND': 'FI', 'SWITZERLAND': 'CH', 'AUSTRIA': 'AT', 'PORTUGAL': 'PT',
  'IRELAND': 'IE', 'NEW ZEALAND': 'NZ', 'SINGAPORE': 'SG', 'MALAYSIA': 'MY',
  'THAILAND': 'TH', 'VIETNAM': 'VN', 'PHILIPPINES': 'PH',
}

const ISO_TO_NAME = {
  'IN': 'India', 'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France',
  'DE': 'Germany', 'JP': 'Japan', 'CN': 'China', 'AU': 'Australia',
  'BR': 'Brazil', 'RU': 'Russia', 'IR': 'Iran', 'SA': 'Saudi Arabia',
  'ZA': 'South Africa', 'NG': 'Nigeria', 'EG': 'Egypt', 'MX': 'Mexico',
  'AR': 'Argentina', 'ID': 'Indonesia', 'PK': 'Pakistan', 'TR': 'Turkey',
  'CA': 'Canada', 'KR': 'South Korea', 'ES': 'Spain', 'IT': 'Italy',
  'UA': 'Ukraine', 'PL': 'Poland', 'AE': 'United Arab Emirates',
  'IL': 'Israel', 'TW': 'Taiwan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka',
  'NP': 'Nepal', 'IQ': 'Iraq', 'SY': 'Syria', 'YE': 'Yemen',
  'JO': 'Jordan', 'LB': 'Lebanon', 'GR': 'Greece', 'PH': 'Philippines',
}

// Dashboard Categories -> NewsData API Categories
const DASHBOARD_TO_API = {
  'politics': 'politics',
  'economy': 'business',
  'conflict': 'politics', // Better fallback than economy
  'society': 'top',
  'technology': 'technology',
  'sports': 'sports',
  'environment': 'environment',
}

// NewsData API Categories -> Dashboard Categories
const CATEGORY_MAP = {
  'politics': 'politics',
  'business': 'economy',
  'economy': 'economy',
  'crime': 'society',
  'domestic': 'society',
  'education': 'society',
  'entertainment': 'society',
  'environment': 'environment',
  'food': 'society',
  'health': 'society',
  'lifestyle': 'society',
  'science': 'technology',
  'sports': 'sports',
  'technology': 'technology',
  'tourism': 'society',
  'world': 'society', // Move world to society to keep politics clean
  'top': 'politics',
  'other': 'society'
}

async function fetchNews({ countryCode, category, page, source }) {
  const isGlobal = !countryCode || countryCode.toLowerCase() === 'all'
  
  // All categories requested? Use parallel fetching to ensure markers for every layer
  if (category === 'all' || !category) {
    const catsToFetch = ['business', 'politics', 'technology', 'sports', 'science', 'environment', 'world']
    console.log(`Marker Density: Parallel fetch for ${isGlobal ? 'Global' : countryCode} (${catsToFetch.length} categories)`)
    
    try {
      const requests = catsToFetch.map(cat => {
        const p = {
          apikey: process.env.NEWSDATA_API_KEY,
          language: 'en',
          category: cat
        }
        if (!isGlobal) p.country = countryCode.toLowerCase()
        if (source) p.domain = source
        return axios.get('https://newsdata.io/api/1/news', { params: p, timeout: 8000 })
      })

      const responses = await Promise.allSettled(requests)
      let allResults = []
      let successCount = 0
      
      responses.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value.data.results) {
          successCount++
          allResults = [...allResults, ...res.value.data.results]
        } else if (res.status === 'rejected') {
          console.warn(`Category Fetch Failed (${catsToFetch[idx]}):`, res.reason.message)
        }
      })

      console.log(`Parallel Complete: ${successCount}/${catsToFetch.length} succeeded. Total raw: ${allResults.length}`)

      const normalized = normalizeArticles(allResults, isGlobal, countryCode)
      return {
        articles:    normalized,
        totalCount:  normalized.length,
        country:     isGlobal ? 'ALL' : countryCode,
        lastUpdated: new Date().toISOString(),
        nextPage:    null,
      }
    } catch (error) {
      console.error('Parallel Fetch Error:', error.message)
    }
  }

  // Standard single fetch (for specific country or specific category)
  const apiKey = process.env.NEWSDATA_API_KEY || process.env.VITE_NEWSDATA_KEY
  const params = {
    apikey: apiKey,
    language: 'en',
  }

  if (page && page !== '1' && page !== 1) {
    params.page = page
  }

  if (!isGlobal) {
    params.country = countryCode.toLowerCase()
  }

  if (category && category !== 'all') {
    params.category = DASHBOARD_TO_API[category] || 'top' 
  } else if (category === 'all') {
    // NewsData API limit is 5 categories per query. 
    params.category = 'business,politics,technology,top,science'
  }
  
  if (source) params.domain = source

  console.log('NewsData Request Params:', { ...params, apikey: '***' })

  try {
    const response = await axios.get('https://newsdata.io/api/1/news', { params, timeout: 5000 })
    let normalized = normalizeArticles(response.data.results || [], isGlobal, countryCode)

    // CATEGORY ENFORCEMENT:
    // If a specific category was requested (not 'all'), filter out articles
    // that were re-categorized by our keyword refinement logic.
    if (category && category !== 'all') {
      const targetCategory = category.toLowerCase()
      normalized = normalized.filter(a => a.category === targetCategory)
      console.log(`Category Enforcement: Filtered down to ${normalized.length} articles matching '${targetCategory}'`)
    }

    return {
      articles:    normalized,
      totalCount:  response.data.totalResults || 0,
      country:     isGlobal ? 'ALL' : countryCode,
      lastUpdated: new Date().toISOString(),
      nextPage:    response.data.nextPage  || null,
    }
  } catch (error) {
    // ... error handling remains same ...
    return handleError(error, isGlobal, countryCode, params)
  }
}

// Helper to normalize articles
function normalizeArticles(results, isGlobal, countryCode) {
  return results.map(article => {
    const text = `${article.title} ${article.description || ''}`.toLowerCase()
    
    // 1. DYNAMIC GEOGRAPHY MAPPING (Content-based)
    // We prioritize content mentions over API source tags to ensure what you see is what you get.
    let code = null
    
    // Create a list of countries to check (sort by name length descending to catch 'United States' before 'United')
    const countriesToCheck = Object.keys(ISO_TO_NAME).map(iso => ({
      iso,
      name: ISO_TO_NAME[iso].toLowerCase(),
      code: iso.toLowerCase()
    })).sort((a,b) => b.name.length - a.name.length)

    // Check if we are in a specific country view
    if (!isGlobal && countryCode) {
      const targetISO = countryCode.toUpperCase()
      const target = countriesToCheck.find(c => c.iso === targetISO)
      if (target) {
        const mentionsTarget = text.includes(target.name) || 
                               new RegExp(`\\b${target.code}\\b`, 'i').test(text) ||
                               (target.iso === 'US' && text.includes('usa'))
        
        if (mentionsTarget) code = target.iso
      }
    } else {
      // Global mode: Find the first country mentioned in the text
      for (const country of countriesToCheck) {
        const mentionsMatch = text.includes(country.name) || 
                              new RegExp(`\\b${country.code}\\b`, 'i').test(text) ||
                              (country.iso === 'US' && text.includes('usa'))
        
        if (mentionsMatch) {
          code = country.iso
          break
        }
      }
      
      // Fallback only if global and no country mentioned? 
      // User said "Just because it's written by an Indian newspaper doesn't mean it should appear in India section".
      // Let's be strict: if no mention, no marker. This keeps the globe clean.
    }

    // 2. CATEGORY REPLENISHMENT & REFINEMENT
    let internalCat = 'society'
    if (article.category && article.category.length > 0) {
      const apiCat = article.category[0].toLowerCase()
      internalCat = CATEGORY_MAP[apiCat] || 'society'
    }

    // Tighter conflict keywords using word boundaries
    const isConflict = /\b(war|warfare|military|air\s*strike|missile|bombing|shelling|insurgency|battles|combat|ceasefire|invasion|attack|strike|soldier|navy|air\s*force|troops|combatants|conflict)\b/i.test(text)
    const isEconomy = /\b(market|stock\s*exchange|inflation|gdp|fiscal|monetary|central\s*bank|trade\s*deficit|interest\s*rate|revenue|profit|stocks|economy)\b/i.test(text)
    const isEnvironment = /\b(climate|environment|pollution|emission|renewables|storm|hurricane|cyclone|wildfire|earthquake|flood|weather)\b/i.test(text)
    
    if (isConflict) {
      internalCat = 'conflict'
    } else if (isEnvironment) {
      internalCat = 'environment'
    } else if (isEconomy && (internalCat === 'politics' || internalCat === 'society')) {
      internalCat = 'economy'
    }

    return { ...article, country_code: code, category: internalCat }
  }).filter(a => a.country_code)
}

function handleError(error, isGlobal, countryCode, params) {
  if (error.response) {
    console.error('NewsData API Error Detail:', error.response.data)
    if (error.response.status === 422) {
      return { articles: [], totalCount: 0, country: isGlobal ? 'ALL' : countryCode, lastUpdated: new Date().toISOString() }
    }
  } else {
    console.error('NewsData API Error:', error.message)
  }
  
  if (!params.apikey || params.apikey === 'your_newsdata_api_key' || params.apikey.includes('pub_your')) {
    return {
      articles: [{ title: "API Key Required", link: "https://newsdata.io", description: "Check NEWSDATA_API_KEY", country_code: "US", category: ["system"] }],
      totalCount: 1, country: "ALL"
    }
  }
  throw error
}

export { fetchNews }
