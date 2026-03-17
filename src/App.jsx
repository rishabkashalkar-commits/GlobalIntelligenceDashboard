import { Suspense, lazy, useState, useEffect } from 'react'
import useGlobeStore from './store/useGlobeStore'
import Navbar from './components/Navbar/Navbar'
import GlobeComponent from './components/Globe/GlobeComponent'
import LayerLegend from './components/Globe/LayerLegend'
import { useNewsData } from './hooks/useNewsData'

const NewsPanel = lazy(() => import('./components/NewsPanel/NewsPanel'))

export default function App() {
  const { isPanelOpen, selectedCountry, activeCategory } = useGlobeStore()
  
  // Fetch news globally on load, then specific to selection
  useNewsData(selectedCountry, activeCategory)

  return (
    <div className="w-screen h-screen bg-base overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <LayerLegend />
        <div
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{ marginRight: isPanelOpen ? '190px' : '0' }}
        >
          <GlobeComponent />
        </div>
        <Suspense fallback={null}>
          <NewsPanel />
        </Suspense>
      </div>
    </div>
  )
}
