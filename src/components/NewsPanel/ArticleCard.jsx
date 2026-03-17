import CategoryBadge from './CategoryBadge'
import useGlobeStore from '../../store/useGlobeStore'
import { supabase } from '../../lib/supabaseClient'
import { formatTimeAgo } from '../../lib/utils'

export default function ArticleCard({ article }) {
  const { selectedCountry } = useGlobeStore()
  const isBreaking = article.category === 'breaking' ||
    (new Date() - new Date(article.pubDate)) < 3600000

  const handleClick = async () => {
    window.open(article.link, '_blank')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('reading_history').insert({
          user_id:      user.id,
          article_url:  article.link,
          headline:     article.title,
          source:       article.source_name,
          country_code: selectedCountry,
        })
      }
    } catch {
      // Silently fail if Supabase isn't configured
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-surfaceAlt border border-borderSubtle rounded-lg p-3
        hover:border-borderMid hover:bg-surfaceHover transition-all
        duration-150 cursor-pointer group
        ${isBreaking ? 'border-l-2 border-l-breaking' : ''}`}
    >
      {isBreaking && (
        <span className="font-mono text-[9px] text-breaking bg-breaking/10 border border-breaking/25 rounded px-1.5 py-0.5 mb-1.5 inline-block">
          BREAKING
        </span>
      )}
      <div className="flex items-center gap-2 mb-1.5">
        {article.source_icon && (
          <img
            src={article.source_icon}
            alt=""
            className="w-4 h-4 rounded-full object-cover bg-surfaceHover flex-shrink-0"
          />
        )}
        <span className="font-mono text-[10px] text-textMuted truncate flex-1">
          {article.source_name}
        </span>
        <span className="font-mono text-[10px] text-textMuted flex-shrink-0">
          {formatTimeAgo(article.pubDate)}
        </span>
      </div>
      <p className="font-body text-sm text-textPrimary leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors">
        {article.title}
      </p>
      <div className="flex items-center gap-2">
        <CategoryBadge category={article.category} />
      </div>
    </div>
  )
}
