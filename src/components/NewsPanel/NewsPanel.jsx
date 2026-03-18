import useGlobeStore from '../../store/useGlobeStore'
import CategoryTabs from './CategoryTabs'
import PanelFilters from './PanelFilters'
import ArticleCard from './ArticleCard'
import WebcamStrip from '../WebcamStrip/WebcamStrip'
import { useNewsData } from '../../hooks/useNewsData'
import { useWebcamTrigger } from '../../hooks/useWebcamTrigger'
import { COUNTRY_FLAGS } from '../../lib/constants'
function getRegionLabel(code) {
  const regions = {
    IN: 'South Asia', US: 'North America', GB: 'Europe',
    FR: 'Europe', DE: 'Europe', IR: 'Middle East',
    JP: 'East Asia', CN: 'East Asia', AU: 'Oceania',
    SA: 'Middle East', AE: 'Middle East', UA: 'Europe',
    PK: 'South Asia', BR: 'South America', AR: 'South America',
    ZA: 'Africa', NG: 'Africa', EG: 'Africa',
    KR: 'East Asia', TR: 'Eurasia', RU: 'Eurasia',
  }
  return regions[code] || 'Global'
}
const getCountryName = (code) => {
  if (!code) return '🌐 Global';
  if (code.length > 2) return code; // Already a full name
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code;
  } catch (e) {
    return code;
  }
};
const ISO_FROM_NAME = {
  'India': 'IN', 'United States': 'US', 'United Kingdom': 'GB', 'France': 'FR',
  'Germany': 'DE', 'Japan': 'JP', 'China': 'CN', 'Australia': 'AU',
  'Brazil': 'BR', 'Russia': 'RU', 'Iran': 'IR', 'Saudi Arabia': 'SA',
}
export default function NewsPanel() {
  const {
    isPanelOpen, closePanel, selectedCountry,
    activeCategory, articles, isLoadingNews, newsError, showWebcams
  } = useGlobeStore()
  // Resolve ISO for flags/regions
  const isoCode = ISO_FROM_NAME[selectedCountry] || (selectedCountry?.length === 2 ? selectedCountry.toUpperCase() : null)
  useWebcamTrigger(articles, selectedCountry)
  if (!isPanelOpen) return null
  return (
    <div className={`fixed right-0 top-[48px] w-[380px] h-[calc(100vh-48px)]
      bg-surface border-l border-borderSubtle flex flex-col z-40
      transform transition-transform duration-300 ease-in-out
      ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Country Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-borderSubtle flex items-center gap-3">
        <span className="text-2xl">{COUNTRY_FLAGS[isoCode] || '🌐'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base font-medium text-textPrimary truncate">
            {getCountryName(selectedCountry)}
          </p>
          <p className="font-mono text-[10px] text-textMuted">
            {getRegionLabel(isoCode || selectedCountry)}
          </p>
        </div>
        <button
          onClick={closePanel}
          className="w-7 h-7 rounded-md bg-surfaceAlt flex items-center justify-center text-textMuted hover:bg-surfaceHover hover:text-textPrimary transition-colors flex-shrink-0 cursor-pointer"
        >
          ✕
        </button>
      </div>
      <CategoryTabs />
      <PanelFilters />
      {/* Article List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {isLoadingNews
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-surfaceAlt rounded-lg animate-pulse" />
            ))
          : newsError 
          ? (
            <div className="flex flex-col items-center justify-center pt-12 px-6 text-center">
              <span className="text-2xl mb-3">⚠️</span>
              <p className="font-display text-sm text-textPrimary mb-1">Unable to load news</p>
              <p className="font-mono text-[10px] text-textMuted leading-relaxed">
                {newsError}. Please check your connection and try again.
              </p>
            </div>
          )
          : articles.map((article, i) => (
              <ArticleCard key={i} article={article} />
            ))
        }
        {!isLoadingNews && !newsError && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-12 px-6 text-center">
            <span className="text-2xl mb-3">🔍</span>
            <p className="font-display text-sm text-textPrimary mb-1">Quiet in this region</p>
            <p className="font-mono text-[10px] text-textMuted leading-relaxed">
              No matching articles found for this category or region. Try another filter.
            </p>
          </div>
        )}
      </div>
      {showWebcams && <WebcamStrip country={selectedCountry} />}
    </div>
  )
}
