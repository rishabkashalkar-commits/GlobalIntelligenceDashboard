import { CATEGORIES, COUNTRY_FLAGS } from '../../lib/constants'
import { getCountryName } from './MarkerLayer'

const catMeta = (id) => CATEGORIES.find(c => c.id === id) || { label: id, hex: '#94a3b8' }
const WIDTH = 248

export default function MarkerTooltip({ tooltip }) {
  if (!tooltip) return null
  const { code, total, breakdown = [], isBreaking, x, y } = tooltip

  const flipX = x + WIDTH + 24 > window.innerWidth
  const left = flipX ? x - WIDTH - 16 : x + 16
  const top = Math.max(12, Math.min(y - 24, window.innerHeight - 220))

  return (
    <div
      className="gi-tooltip pointer-events-none fixed z-50 rounded-xl border border-borderMid bg-surface/80 backdrop-blur-md px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
      style={{ left, top, width: WIDTH }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {COUNTRY_FLAGS[code] && <span className="text-base leading-none">{COUNTRY_FLAGS[code]}</span>}
          <p className="font-display text-sm font-semibold text-textPrimary truncate">
            {getCountryName(code)}
          </p>
        </div>
        {isBreaking && (
          <span className="flex items-center gap-1 rounded-full bg-live/15 px-2 py-0.5 font-mono text-[9px] tracking-widest text-live">
            <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-textSecondary">
        {total} {total === 1 ? 'event' : 'events'}
      </p>

      {/* Category mix */}
      <div className="mt-2.5 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
        {breakdown.map(([cat, n]) => (
          <div key={cat} style={{ width: `${(n / total) * 100}%`, background: catMeta(cat).hex }} />
        ))}
      </div>
      <div className="mt-2 space-y-1">
        {breakdown.slice(0, 3).map(([cat, n]) => (
          <div key={cat} className="flex items-center justify-between font-body text-[11px]">
            <span className="flex items-center gap-1.5 text-textSecondary">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: catMeta(cat).hex, boxShadow: `0 0 6px ${catMeta(cat).hex}` }}
              />
              {catMeta(cat).label}
            </span>
            <span className="font-mono text-textPrimary">{n}</span>
          </div>
        ))}
      </div>

      <p className="mt-2.5 border-t border-borderSubtle pt-2 font-mono text-[9px] tracking-wider text-accent/70">Click to explore →</p>
    </div>
  )
}
