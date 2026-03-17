import useGlobeStore from '../../store/useGlobeStore'
import { CATEGORIES } from '../../lib/constants'

export default function LayerLegend() {
  const { activeLayers, toggleLayer } = useGlobeStore()

  return (
    <div className="w-[160px] h-[calc(100vh-48px)] bg-surface border-r border-borderSubtle flex-shrink-0 pt-5 px-3 overflow-y-auto">

      <p className="font-mono text-[9px] text-textMuted tracking-[0.15em] uppercase mb-4 px-1">
        Layers
      </p>

      <div className="space-y-0.5">
        {CATEGORIES.map(cat => {
          const isOn = activeLayers.includes(cat.id)
          return (
            <div
              key={cat.id}
              onClick={() => toggleLayer(cat.id)}
              className="flex items-center gap-2.5 py-1.5 px-1 rounded-md cursor-pointer hover:bg-surfaceAlt transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.hex, opacity: isOn ? 1 : 0.3 }}
              />

              <span className={`font-body text-xs flex-1 transition-colors
                ${isOn ? 'text-textSecondary' : 'text-textMuted'}`}>
                {cat.label}
              </span>

              {/* Toggle switch */}
              <div className={`relative w-7 h-4 rounded-full transition-colors duration-200 flex-shrink-0
                ${isOn ? 'bg-accent' : 'bg-surfaceHover'}`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm
                  ${isOn ? 'left-3.5' : 'left-0.5'}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
