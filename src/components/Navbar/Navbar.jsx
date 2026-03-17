import useGlobeStore from '../../store/useGlobeStore'

export default function Navbar() {
  const { globeMode, setGlobeMode } = useGlobeStore()
  const modes = ['Global', 'Regional', 'Country']

  return (
    <nav className="h-12 bg-surface border-b border-borderSubtle px-5 flex items-center justify-between flex-shrink-0">

      {/* Left: Logo */}
      <div className="flex items-center">
        <span className="font-display text-base font-semibold text-accent tracking-wide">
          GLOBE
        </span>
        <span className="font-mono text-[9px] text-accent bg-accentGlow border border-borderSubtle rounded-full px-2 py-0.5 ml-2">
          v1.0
        </span>
      </div>

      {/* Centre: Mode pills */}
      <div className="flex items-center gap-1.5">
        {modes.map(mode => {
          const isActive = globeMode === mode.toLowerCase()
          return (
            <button
              key={mode}
              onClick={() => setGlobeMode(mode.toLowerCase())}
              className={`font-mono text-[10px] px-3 py-1.5 rounded-full cursor-pointer transition-colors
                ${isActive
                  ? 'bg-accentGlow text-accent border border-borderMid'
                  : 'bg-surfaceAlt text-textMuted border border-borderSubtle hover:text-textSecondary hover:border-borderMid'
                }`}
            >
              {mode}
            </button>
          )
        })}
      </div>

      {/* Right: Search + Avatar */}
      <div className="flex items-center gap-2">
        <button className="text-textMuted hover:text-accent transition-colors cursor-pointer">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
        </button>
        <div className="w-7 h-7 rounded-full bg-surfaceAlt border border-borderSubtle flex items-center justify-center">
          <span className="font-mono text-[10px] text-textSecondary">GI</span>
        </div>
      </div>
    </nav>
  )
}
