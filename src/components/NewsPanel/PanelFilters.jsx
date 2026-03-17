import useGlobeStore from '../../store/useGlobeStore'

export default function PanelFilters() {
  const { dateFilter, setDateFilter, sourceFilter, setSourceFilter } = useGlobeStore()

  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-borderSubtle">
      <select
        value={dateFilter}
        onChange={e => setDateFilter(e.target.value)}
        className="font-mono text-[10px] bg-surfaceAlt text-textSecondary border border-borderSubtle rounded-md px-2 py-1.5 cursor-pointer hover:border-borderMid outline-none appearance-none"
      >
        <option value="all">All time</option>
        <option value="1h">Last hour</option>
        <option value="24h">Last 24h</option>
        <option value="7d">Last 7 days</option>
      </select>

      <select
        value={sourceFilter}
        onChange={e => setSourceFilter(e.target.value)}
        className="font-mono text-[10px] bg-surfaceAlt text-textSecondary border border-borderSubtle rounded-md px-2 py-1.5 cursor-pointer hover:border-borderMid outline-none appearance-none"
      >
        <option value="all">All sources</option>
        <option value="bbc">BBC</option>
        <option value="reuters">Reuters</option>
        <option value="apnews">AP News</option>
        <option value="nytimes">NY Times</option>
        <option value="dw">DW</option>
      </select>
    </div>
  )
}
