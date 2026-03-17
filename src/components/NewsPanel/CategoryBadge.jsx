const STYLES = {
  politics:    'bg-politics/10 border-politics/25 text-politics',
  economy:     'bg-economy/10 border-economy/25 text-economy',
  conflict:    'bg-conflict/10 border-conflict/25 text-conflict',
  society:     'bg-society/10 border-society/25 text-society',
  technology:  'bg-technology/10 border-technology/25 text-technology',
  sports:      'bg-sports/10 border-sports/25 text-sports',
  environment: 'bg-environment/10 border-environment/25 text-environment',
  breaking:    'bg-breaking/10 border-breaking/25 text-breaking',
  live:        'bg-live/10 border-live/25 text-live',
  top:         'bg-accent/10 border-accent/25 text-accent',
}

export const CategoryBadge = ({ category }) => (
  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border capitalize ${STYLES[category] || STYLES.top}`}>
    {category}
  </span>
)

export default CategoryBadge
