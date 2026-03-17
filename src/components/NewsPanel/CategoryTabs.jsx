import useGlobeStore from '../../store/useGlobeStore'
import { TABS } from '../../lib/constants'

export default function CategoryTabs() {
  const { activeCategory, setActiveCategory } = useGlobeStore()

  return (
    <div
      className="flex-shrink-0 flex overflow-x-auto border-b border-borderSubtle"
      style={{ scrollbarWidth: 'none' }}
    >
      <style>{`.cat-tabs::-webkit-scrollbar { display: none; }`}</style>
      {TABS.map(tab => {
        const isActive = activeCategory === tab
        return (
          <button
            key={tab}
            onClick={() => setActiveCategory(tab)}
            className={`font-mono text-[10px] px-4 py-2.5 whitespace-nowrap cursor-pointer flex-shrink-0 transition-colors
              ${isActive
                ? 'text-accent border-b-2 border-accent'
                : 'text-textMuted hover:text-textSecondary'
              }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        )
      })}
    </div>
  )
}
