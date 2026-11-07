import { create } from 'zustand'

const useGlobeStore = create((set) => ({
  selectedCountry:    null,
  setSelectedCountry: (code) => set({ selectedCountry: code }),

  globeMode: 'global',
  setGlobeMode: (mode) => set({ globeMode: mode }),

  isPanelOpen: false,
  openPanel:   () => set({ isPanelOpen: true }),
  closePanel:  () => set({ isPanelOpen: false, selectedCountry: null, newsError: null }),

  activeCategory: 'all',
  setActiveCategory: (cat) => set({ activeCategory: cat }),

  activeLayers: ['politics','economy','conflict','society',
                 'technology','sports','environment'],
  toggleLayer: (layer) => set((state) => ({
    activeLayers: state.activeLayers.includes(layer)
      ? state.activeLayers.filter(l => l !== layer)
      : [...state.activeLayers, layer]
  })),

  // Single article pool shared by the globe markers and the news panel.
  // Every fetch (global or per-country) is merged in, never replaced, so
  // marker counts and panel lists are always computed from the same data.
  articles:       [],
  mergeArticles:  (incoming) => set((state) => {
    const seen = new Set(state.articles.map(articleKey))
    const fresh = incoming.filter(a => {
      const k = articleKey(a)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    return fresh.length ? { articles: [...state.articles, ...fresh] } : {}
  }),
  loadedCountries: {},
  markCountryLoaded: (code) => set((state) => ({
    loadedCountries: { ...state.loadedCountries, [code]: true }
  })),
  isLoadingNews:  false,
  setLoadingNews: (bool) => set({ isLoadingNews: bool }),
  newsError:      null,
  setNewsError:   (error) => set({ newsError: error }),

  showWebcams:    false,
  setShowWebcams: (bool) => set({ showWebcams: bool }),
  webcamStreams:  [],
  setWebcamStreams: (streams) => set({ webcamStreams: streams }),

  dateFilter:   'all',
  setDateFilter: (val) => set({ dateFilter: val }),

  sourceFilter:   'all',
  setSourceFilter: (val) => set({ sourceFilter: val }),
}))

// Articles for one country, newest first — the same set the globe markers count
export function articlesForCountry(articles, code) {
  if (!code) return []
  const iso = code.toUpperCase()
  return articles
    .filter(a => (a.country_code || '').toUpperCase() === iso)
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
}

// An article can legitimately belong to more than one country
function articleKey(a) {
  return `${a.link || a.article_id || a.title}|${(a.country_code || '').toUpperCase()}`
}

export default useGlobeStore
