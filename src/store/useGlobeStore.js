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

  articles:       [],
  setArticles:    (articles) => set({ articles }),
  isLoadingNews:  false,
  setLoadingNews: (bool) => set({ isLoadingNews: bool }),
  newsError:      null,
  setNewsError:   (error) => set({ newsError: error }),

  showWebcams:    false,
  setShowWebcams: (bool) => set({ showWebcams: bool }),

  dateFilter:   'all',
  setDateFilter: (val) => set({ dateFilter: val }),

  sourceFilter:   'all',
  setSourceFilter: (val) => set({ sourceFilter: val }),
}))

export default useGlobeStore
