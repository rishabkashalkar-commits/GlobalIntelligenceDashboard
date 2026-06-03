import { useEffect, useRef } from 'react'
import useGlobeStore from '../../store/useGlobeStore'
import { TABS } from '../../lib/constants'
export default function CategoryTabs() {
  const { activeCategory, setActiveCategory } = useGlobeStore()
  const scrollRef = useRef(null)
  const tabsRef = useRef({})
  // Auto-scroll the active tab into view
  useEffect(() => {
    const activeTab = tabsRef.current[activeCategory]
    if (activeTab && scrollRef.current) {
      const container = scrollRef.current
      const tabRect = activeTab.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeCategory])
  return (
    <div className="relative flex-shrink-0 border-b border-white/5 bg-surface/50 backdrop-blur-md">
      {/* Scroll indicator fades - left */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
      
      {/* Scroll indicator fades - right */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />
      
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar scroll-smooth px-6 py-1 select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .tab-glint {
            position: absolute;
            bottom: 0px;
            height: 2px;
            background: #3B82F6;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
        
        <div className="flex gap-1 relative">
          {TABS.map(tab => {
            const isActive = activeCategory === tab
            const label = tab === 'all' ? 'All Feed' : tab.charAt(0).toUpperCase() + tab.slice(1)
            
            // Map tab ID to tailwind color class
            const activeColorClass = tab === 'all' ? 'bg-accent' : `bg-${tab}`
            
            return (
              <button
                key={tab}
                ref={el => tabsRef.current[tab] = el}
                onClick={() => setActiveCategory(tab)}
                className={`group relative font-mono text-[10px] tracking-wider px-4 py-3 whitespace-nowrap cursor-pointer flex-shrink-0 transition-all duration-300
                  ${isActive
                    ? 'text-textPrimary font-bold'
                    : 'text-textMuted hover:text-textPrimary'
                  }`}
              >
                {label}
                {/* Underline for active state */}
                <div 
                  className={`absolute bottom-0 left-2 right-2 h-[2px] transition-all duration-300 transform rounded-full
                    ${isActive ? `${activeColorClass} scale-x-100` : 'bg-white/10 scale-x-0 group-hover:scale-x-50'}
                  `} 
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
