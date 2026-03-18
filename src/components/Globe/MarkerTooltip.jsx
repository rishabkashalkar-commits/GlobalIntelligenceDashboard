import CategoryBadge from '../NewsPanel/CategoryBadge'

const getCountryName = (code) => {
  if (!code || code === 'all') return 'Global';
  if (code.length > 2) return code;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code;
  } catch (e) {
    return code;
  }
};

export default function MarkerTooltip({ tooltip }) {
  if (!tooltip) return null
  const { data, x, y, category, count } = tooltip

  return (
    <div
      className="pointer-events-none absolute z-50 bg-surface border border-borderMid rounded-lg px-3 py-1.5 shadow-xl min-w-[150px]"
      style={{ left: x + 10, top: y - 40 }}
    >
      <p className="font-display text-sm font-medium text-textPrimary">
        {getCountryName(data.country_code)}
      </p>
      <p className="font-body text-xs text-textSecondary mt-0.5">
        {count > 1 ? `${count} events in this category` : `${data.title?.slice(0, 40)}...`}
      </p>
      <div className="mt-2">
        <CategoryBadge category={category} />
      </div>
      <p className="font-mono text-[9px] text-textMuted mt-2">Click to explore →</p>
    </div>
  )
}
